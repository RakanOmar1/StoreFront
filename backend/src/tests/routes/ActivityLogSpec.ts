import request from 'supertest'
import app from '../../server'
import { clearTables, createTables } from '../helpers/db'

describe('Admin chatter activity API', () => {
  let adminToken: string

  beforeAll(async () => {
    await createTables()
  })

  beforeEach(async () => {
    await clearTables()

    const admin = await request(app)
      .post('/users')
      .send({ firstname: 'Admin', lastname: 'User', password: 'secret', role: 'ADMIN' })

    adminToken = admin.body.token
  })

  afterAll(async () => {
    await clearTables()
  })

  it('logs create, update, comment, and paginated timeline entries', async () => {
    const created = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Audit Shoe', price: 80, category: 'running', password: 'hidden' })

    await request(app)
      .put(`/products/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Audit Shoe', price: 95, category: 'running' })

    const note = await request(app)
      .post(`/api/admin/chatter/PRODUCT/${created.body.id}/messages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: ' Keep this visible for launch. ' })

    const firstPage = await request(app)
      .get(`/api/admin/chatter/PRODUCT/${created.body.id}?page=1&pageSize=2`)
      .set('Authorization', `Bearer ${adminToken}`)

    const allText = JSON.stringify(firstPage.body)

    expect(note.status).toBe(201)
    expect(note.body.message).toBe('Keep this visible for launch.')
    expect(firstPage.status).toBe(200)
    expect(firstPage.body.items.length).toBe(2)
    expect(firstPage.body.total).toBeGreaterThan(1)
    expect(allText).not.toContain('hidden')
    expect(firstPage.body.items.some((item: { event_type: string }) => item.event_type === 'COMMENT')).toBeTrue()
  })

  it('requires admin access for chatter endpoints', async () => {
    const customer = await request(app)
      .post('/users')
      .send({ firstname: 'Normal', lastname: 'User', password: 'secret', role: 'CUSTOMER' })

    const response = await request(app)
      .get('/api/admin/chatter/PRODUCT/1')
      .set('Authorization', `Bearer ${customer.body.token}`)

    expect(response.status).toBe(403)
  })
})
