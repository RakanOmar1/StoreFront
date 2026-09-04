import request from 'supertest'
import app from '../../server'
import pool from '../../config/database'
import { clearTables, createTables } from '../helpers/db'

describe('Cart synchronization API', () => {
  let token: string
  let productId: number

  beforeAll(async () => {
    await createTables()
  })

  beforeEach(async () => {
    await clearTables()
    const user = await request(app)
      .post('/users')
      .send({ firstname: 'Cart', lastname: 'Customer', password: 'secret' })

    token = user.body.token
    const product = await pool.query(
      `INSERT INTO products (name, price, category)
       VALUES ('Cart product', 12, 'test') RETURNING id`
    )
    productId = Number(product.rows[0].id)
  })

  afterAll(async () => {
    await clearTables()
  })

  it('sets matching quantities exactly and remains unchanged when replayed', async () => {
    await request(app)
      .post('/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 2 })

    const payload = { items: [{ productId, quantity: 3 }] }
    const first = await request(app)
      .put('/cart/sync')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
    const repeated = await request(app)
      .put('/cart/sync')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)

    expect(first.status).toBe(200)
    expect(first.body.items[0].quantity).toBe(3)
    expect(repeated.status).toBe(200)
    expect(repeated.body.items.length).toBe(1)
    expect(repeated.body.items[0].quantity).toBe(3)
  })

  it('preserves server-only lines and treats an empty guest cart as a no-op', async () => {
    await request(app)
      .post('/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 2 })

    const response = await request(app)
      .put('/cart/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [] })

    expect(response.status).toBe(200)
    expect(response.body.items[0].quantity).toBe(2)
  })

  it('rejects missing, invalid, excessive, and duplicate items without changing the cart', async () => {
    const invalidPayloads = [
      {},
      { items: [{ productId, quantity: 0 }] },
      { items: [{ productId, quantity: 100 }] },
      { items: [{ productId, quantity: 1 }, { productId, quantity: 2 }] }
    ]

    for (const payload of invalidPayloads) {
      const response = await request(app)
        .put('/cart/sync')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
      expect(response.status).toBe(400)
    }

    const cart = await request(app)
      .get('/cart')
      .set('Authorization', `Bearer ${token}`)
    expect(cart.body.items).toEqual([])
  })

  it('requires authentication', async () => {
    const response = await request(app)
      .put('/cart/sync')
      .send({ items: [{ productId, quantity: 1 }] })

    expect(response.status).toBe(401)
  })
})
