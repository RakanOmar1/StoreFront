import request from 'supertest'
import app from '../../server'
import { createTables, clearTables } from '../helpers/db'

describe('Storefront API endpoints', () => {
  let token: string
  let userId: number
  let productId: number
  let orderId: number

  beforeAll(async () => {
    await createTables()
  })

  beforeEach(async () => {
    await clearTables()

    const userResponse = await request(app)
      .post('/users')
      .send({ firstname: 'Route', lastname: 'User', password: 'pass' })

    token = userResponse.body.token
    userId = userResponse.body.user.id

    const productResponse = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Pen', price: 3, category: 'office' })

    productId = productResponse.body.id

    const orderResponse = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ user_id: userId, status: 'active' })

    orderId = orderResponse.body.id
  })

  afterAll(async () => {
    await clearTables()
  })

  it('serves Swagger UI', async () => {
    const response = await request(app).get('/api-docs/')

    expect(response.status).toBe(200)
    expect(response.text).toContain('Swagger UI')
  })

  it('handles user endpoints', async () => {
    const list = await request(app).get('/users').set('Authorization', `Bearer ${token}`)
    const show = await request(app).get(`/users/${userId}`).set('Authorization', `Bearer ${token}`)
    const update = await request(app)
      .put(`/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstname: 'Updated', lastname: 'User', password: 'newpass' })
    const remove = await request(app).delete(`/users/${userId}`).set('Authorization', `Bearer ${token}`)

    expect(list.status).toBe(200)
    expect(list.body[0].password_digest).toBeUndefined()
    expect(show.body.firstname).toBe('Route')
    expect(show.body.password_digest).toBeUndefined()
    expect(update.body.firstname).toBe('Updated')
    expect(update.body.password_digest).toBeUndefined()
    expect(remove.body.password_digest).toBeUndefined()
    expect(remove.status).toBe(200)
  })

  it('rejects protected users endpoints without a token', async () => {
    const response = await request(app).get('/users')
    expect(response.status).toBe(401)
  })

  it('logs users in and rejects bad credentials', async () => {
    const good = await request(app)
      .post('/auth/login')
      .send({ firstname: 'Route', password: 'pass' })
    const bad = await request(app)
      .post('/auth/login')
      .send({ firstname: 'Route', password: 'wrong' })

    expect(good.status).toBe(200)
    expect(good.body.token).toBeDefined()
    expect(good.body.user.password_digest).toBeUndefined()
    expect(bad.status).toBe(401)
  })

  it('registers and logs users out through auth endpoints', async () => {
    const signup = await request(app)
      .post('/auth/register')
      .send({ firstname: 'Signup', lastname: 'User', password: 'pass123' })

    const logout = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${signup.body.token}`)

    const rejectedLogout = await request(app).post('/auth/logout')

    expect(signup.status).toBe(201)
    expect(signup.body.token).toBeDefined()
    expect(signup.body.user.firstname).toBe('Signup')
    expect(signup.body.user.password_digest).toBeUndefined()
    expect(logout.status).toBe(200)
    expect(logout.body.message).toBe('Logged out')
    expect(rejectedLogout.status).toBe(401)
  })

  it('handles product endpoints', async () => {
    await request(app)
      .post(`/orders/${orderId}/products`)
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: productId, quantity: 2 })

    const list = await request(app).get('/products')
    const filtered = await request(app).get('/products?search=pen&category=office&maxPrice=3&limit=50&offset=0')
    const filters = await request(app).get('/products/filters')
    const show = await request(app).get(`/products/${productId}`)
    const popular = await request(app).get('/products/popular')
    const update = await request(app)
      .put(`/products/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Blue Pen', price: 4, category: 'office' })
    const remove = await request(app).delete(`/products/${productId}`).set('Authorization', `Bearer ${token}`)

    expect(list.status).toBe(200)
    expect(filtered.body.length).toBe(1)
    expect(filters.body.categories).toEqual(['office'])
    expect(filters.body.maxPrice).toBe(3)
    expect(show.body.name).toBe('Pen')
    expect(popular.body[0].name).toBe('Pen')
    expect(update.body.name).toBe('Blue Pen')
    expect(remove.status).toBe(200)
  })

  it('rejects protected product writes without a token', async () => {
    const response = await request(app).post('/products').send({ name: 'Desk', price: 60 })
    expect(response.status).toBe(401)
  })

  it('handles order endpoints', async () => {
    const addProduct = await request(app)
      .post(`/orders/${orderId}/products`)
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: productId, quantity: 5 })
    const list = await request(app).get('/orders').set('Authorization', `Bearer ${token}`)
    const show = await request(app).get(`/orders/${orderId}`).set('Authorization', `Bearer ${token}`)
    const current = await request(app).get(`/orders/users/${userId}/current`).set('Authorization', `Bearer ${token}`)
    const update = await request(app)
      .put(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ user_id: userId, status: 'complete' })
    const completed = await request(app).get(`/orders/users/${userId}/completed`).set('Authorization', `Bearer ${token}`)
    const remove = await request(app).delete(`/orders/${orderId}`).set('Authorization', `Bearer ${token}`)

    expect(addProduct.status).toBe(201)
    expect(list.body.length).toBe(1)
    expect(show.body.status).toBe('active')
    expect(current.body.length).toBe(1)
    expect(update.body.status).toBe('complete')
    expect(completed.body.length).toBe(1)
    expect(remove.status).toBe(200)
  })

  it('rejects protected order endpoints without a token', async () => {
    const response = await request(app).get('/orders')
    expect(response.status).toBe(401)
  })

  it('returns 404 for missing records', async () => {
    const user = await request(app).get('/users/999').set('Authorization', `Bearer ${token}`)
    const product = await request(app).get('/products/999')
    const order = await request(app).get('/orders/999').set('Authorization', `Bearer ${token}`)

    expect(user.status).toBe(404)
    expect(product.status).toBe(404)
    expect(order.status).toBe(404)
  })
})
