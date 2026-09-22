import request from 'supertest'
import fs from 'fs'
import path from 'path'
import app from '../../server'
import { createTables, clearTables } from '../helpers/db'
import pool from '../../config/database'

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
    await pool.query("UPDATE users SET role = 'ADMIN' WHERE id = $1", [userId])
    const adminLogin = await request(app)
      .post('/auth/login')
      .send({ firstname: 'Route', password: 'pass' })
    token = adminLogin.body.token

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

  it('invalidates an existing session when an administrator changes its role', async () => {
    const customer = await request(app)
      .post('/auth/register')
      .send({
        firstname: 'Role',
        lastname: 'Change',
        email: 'role.change@example.com',
        password: 'secret'
      })

    const changed = await request(app)
      .put(`/users/${customer.body.user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstname: 'Role',
        lastname: 'Change',
        email: 'role.change@example.com',
        role: 'DELIVERY'
      })

    const staleSession = await request(app)
      .get('/profile')
      .set('Authorization', `Bearer ${customer.body.token}`)
    const staleOptionalSession = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${customer.body.token}`)
      .send({ firstname: 'Blocked', lastname: 'Session', password: 'secret' })
    const freshLogin = await request(app)
      .post('/auth/login')
      .send({ identifier: 'role.change@example.com', password: 'secret' })
    const freshSession = await request(app)
      .get('/profile')
      .set('Authorization', `Bearer ${freshLogin.body.token}`)

    expect(changed.status).toBe(200)
    expect(changed.body.role).toBe('DELIVERY')
    expect(staleSession.status).toBe(401)
    expect(staleSession.body.code).toBe('SESSION_STALE')
    expect(staleOptionalSession.status).toBe(401)
    expect(staleOptionalSession.body.code).toBe('SESSION_STALE')
    expect(freshLogin.status).toBe(200)
    expect(freshLogin.body.user.role).toBe('DELIVERY')
    expect(freshSession.status).toBe(200)
  })

  it('allows local Angular and Flutter web development origins through CORS', async () => {
    for (const origin of [
      'http://localhost:4200',
      'http://127.0.0.1:4200',
      'http://localhost:7357',
      'http://127.0.0.1:7357'
    ]) {
      const response = await request(app)
        .options('/products')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'GET')

      expect(response.status).toBe(204)
      expect(response.headers['access-control-allow-origin']).toBe(origin)
      expect(response.headers['vary']).toContain('Origin')
    }
  })

  it('serves uploaded avatars with Flutter web CORS headers', async () => {
    const directory = path.resolve('uploads', 'test-fixtures')
    const file = path.join(directory, 'avatar.txt')
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(file, 'avatar')

    try {
      const response = await request(app)
        .get('/uploads/test-fixtures/avatar.txt')
        .set('Origin', 'http://localhost:7357')

      expect(response.status).toBe(200)
      expect(response.text).toBe('avatar')
      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:7357'
      )
      expect(response.headers['x-content-type-options']).toBe('nosniff')
    } finally {
      fs.rmSync(directory, { recursive: true, force: true })
    }
  })

  it('persists a customer email change and authenticates only with the new email', async () => {
    const customer = await request(app)
      .post('/auth/register')
      .send({ firstname: 'Email', lastname: 'Customer', email: 'old@example.com', password: 'secret' })

    const update = await request(app)
      .patch('/profile')
      .set('Authorization', `Bearer ${customer.body.token}`)
      .send({ name: 'Email Customer', email: ' New@Example.com ' })
    const profile = await request(app)
      .get('/profile')
      .set('Authorization', `Bearer ${customer.body.token}`)
    const newEmailLogin = await request(app)
      .post('/auth/login')
      .send({ identifier: 'new@example.com', password: 'secret' })
    const oldEmailLogin = await request(app)
      .post('/auth/login')
      .send({ identifier: 'old@example.com', password: 'secret' })

    expect(update.status).toBe(200)
    expect(update.body.email).toBe('new@example.com')
    expect(profile.body.email).toBe('new@example.com')
    expect(newEmailLogin.status).toBe(200)
    expect(newEmailLogin.body.user.email).toBe('new@example.com')
    expect(oldEmailLogin.status).toBe(401)
  })

  it('registers and logs users out through auth endpoints', async () => {
    const signup = await request(app)
      .post('/auth/register')
      .send({ firstname: 'Signup', lastname: 'User', email: 'signup@example.com', password: 'pass123', address: 'Al Manara', city: 'Ramallah', latitude: 31.9038, longitude: 35.2034 })

    const missingContact = await request(app)
      .post('/auth/register')
      .send({ firstname: 'No', lastname: 'Contact', password: 'pass123' })

    const shortPassword = await request(app)
      .post('/auth/register')
      .send({ firstname: 'Short', lastname: 'Password', phone: '0590000000', password: '12345' })

    const logout = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${signup.body.token}`)

    const rejectedLogout = await request(app).post('/auth/logout')
    const loginAfterLogout = await request(app)
      .post('/auth/login')
      .send({ identifier: 'signup@example.com', password: 'pass123' })

    expect(signup.status).toBe(201)
    expect(signup.body.token).toBeDefined()
    expect(signup.body.user.latitude).toBe(31.9038)
    expect(signup.body.user.longitude).toBe(35.2034)
    expect(signup.body.user.firstname).toBe('Signup')
    expect(signup.body.user.password_digest).toBeUndefined()
    expect(missingContact.status).toBe(400)
    expect(shortPassword.status).toBe(400)
    expect(logout.status).toBe(200)
    expect(logout.body.message).toBe('Logged out')
    expect(rejectedLogout.status).toBe(401)
    expect(loginAfterLogout.status).toBe(200)
    expect(loginAfterLogout.body.user.id).toBe(signup.body.user.id)
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

  it('preserves decimal product prices', async () => {
    const created = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Decimal price item', price: 9.5, category: 'grocery' })

    expect(created.status).toBe(201)
    expect(Number(created.body.price)).toBe(9.5)

    const shown = await request(app).get(`/products/${created.body.id}`)
    expect(Number(shown.body.price)).toBe(9.5)
  })

  it('rejects protected product writes without a token', async () => {
    const response = await request(app).post('/products').send({ name: 'Desk', price: 60 })
    expect(response.status).toBe(401)
  })

  it('lets admins manage brands and assign them to products', async () => {
    const created = await request(app).post('/brands').set('Authorization', `Bearer ${token}`).send({ name: 'Fresh Farm', description: 'Local produce' })
    const updatedProduct = await request(app).put(`/products/${productId}`).set('Authorization', `Bearer ${token}`).send({ name: 'Pen', price: 3, category: 'office', brand_id: created.body.id })
    const list = await request(app).get('/brands')
    const blockedDelete = await request(app).delete(`/brands/${created.body.id}`).set('Authorization', `Bearer ${token}`)

    expect(created.status).toBe(201)
    expect(list.body[0].name).toBe('Fresh Farm')
    expect(updatedProduct.body.brand).toBe('Fresh Farm')
    expect(blockedDelete.status).toBe(400)
  })

  it('prevents public role escalation and cross-account order access', async () => {
    const customer = await request(app)
      .post('/auth/register')
      .send({ firstname: 'Other', lastname: 'Customer', email: 'other.customer@example.com', password: 'secret', role: 'ADMIN' })

    expect(customer.status).toBe(201)
    expect(customer.body.user.role).toBe('CUSTOMER')

    const catalogWrite = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${customer.body.token}`)
      .send({ name: 'Forbidden product', price: 10 })
    const foreignOrder = await request(app)
      .get(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${customer.body.token}`)

    const forbiddenOrderCreate = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customer.body.token}`)
      .send({ status: 'PENDING', total_amount: 10 })
    const ownOrder = await pool.query(
      "INSERT INTO orders (user_id, status, total_amount) VALUES ($1, 'PENDING', 10) RETURNING id",
      [customer.body.user.id]
    )
    const ownOrderRead = await request(app)
      .get(`/orders/${ownOrder.rows[0].id}`)
      .set('Authorization', `Bearer ${customer.body.token}`)
    const forbiddenOrderUpdate = await request(app)
      .put(`/orders/${ownOrder.rows[0].id}`)
      .set('Authorization', `Bearer ${customer.body.token}`)
      .send({ status: 'DELIVERED', payment_status: 'PAID' })
    const forbiddenOrderCancel = await request(app)
      .patch(`/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${customer.body.token}`)
    const ownOrderCancel = await request(app)
      .patch(`/orders/${ownOrder.rows[0].id}/cancel`)
      .set('Authorization', `Bearer ${customer.body.token}`)
    const repeatedCancel = await request(app)
      .patch(`/orders/${ownOrder.rows[0].id}/cancel`)
      .set('Authorization', `Bearer ${customer.body.token}`)

    expect(catalogWrite.status).toBe(403)
    expect(foreignOrder.status).toBe(403)
    expect(forbiddenOrderCreate.status).toBe(403)
    expect(ownOrderRead.status).toBe(200)
    expect(Number(ownOrderRead.body.user_id)).toBe(customer.body.user.id)
    expect(forbiddenOrderUpdate.status).toBe(403)
    expect(forbiddenOrderCancel.status).toBe(403)
    expect(ownOrderCancel.status).toBe(200)
    expect(ownOrderCancel.body.status).toBe('CANCELLED')
    expect(repeatedCancel.status).toBe(409)
  })

  it('allows delivery staff to collect cash without granting catalog administration', async () => {
    await pool.query(
      "UPDATE orders SET delivery_type = 'DELIVERY', delivery_address = 'Al Manara, Ramallah', payment_method = 'CASH', payment_status = 'PENDING', status = 'OUT_FOR_DELIVERY' WHERE id = $1",
      [orderId]
    )
    const created = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstname: 'Delivery', lastname: 'Driver', email: 'driver@example.com', password: 'driver-pass', role: 'DELIVERY' })
    const login = await request(app)
      .post('/auth/login')
      .send({ identifier: 'driver@example.com', password: 'driver-pass' })
    const deliveryToken = login.body.token

    const pickup = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ user_id: userId, status: 'PENDING', delivery_type: 'PICKUP' })

    const list = await request(app).get('/orders').set('Authorization', `Bearer ${deliveryToken}`)
    const show = await request(app).get(`/orders/${orderId}`).set('Authorization', `Bearer ${deliveryToken}`)
    const forbiddenPickupShow = await request(app)
      .get(`/orders/${pickup.body.id}`)
      .set('Authorization', `Bearer ${deliveryToken}`)
    const collect = await request(app)
      .patch(`/orders/${orderId}/delivery`)
      .set('Authorization', `Bearer ${deliveryToken}`)
      .send({ payment_status: 'PAID', status: 'DELIVERED' })
    const forbiddenProduct = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${deliveryToken}`)
      .send({ name: 'Forbidden', price: 1 })
    const forbiddenCancellation = await request(app)
      .patch(`/orders/${orderId}/delivery`)
      .set('Authorization', `Bearer ${deliveryToken}`)
      .send({ status: 'CANCELLED' })

    expect(created.status).toBe(201)
    expect(login.body.user.role).toBe('DELIVERY')
    expect(list.status).toBe(200)
    expect(list.body.length).toBe(1)
    expect(list.body.every((order: { delivery_type: string }) => order.delivery_type === 'DELIVERY')).toBe(true)
    expect(show.status).toBe(200)
    expect(forbiddenPickupShow.status).toBe(403)
    expect(collect.status).toBe(200)
    expect(collect.body.payment_status).toBe('PAID')
    expect(collect.body.status).toBe('DELIVERED')
    expect(forbiddenProduct.status).toBe(403)
    expect(forbiddenCancellation.status).toBe(400)
  })

  it('handles order endpoints', async () => {
    const addProduct = await request(app)
      .post(`/orders/${orderId}/products`)
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: productId, quantity: 5 })
    const updateProduct = await request(app)
      .patch(`/orders/${orderId}/products/${addProduct.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 3 })
    const list = await request(app).get('/orders').set('Authorization', `Bearer ${token}`)
    const show = await request(app).get(`/orders/${orderId}`).set('Authorization', `Bearer ${token}`)
    const removeProduct = await request(app)
      .delete(`/orders/${orderId}/products/${addProduct.body.id}`)
      .set('Authorization', `Bearer ${token}`)
    const afterProductRemoval = await request(app)
      .get(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`)
    const current = await request(app).get(`/orders/users/${userId}/current`).set('Authorization', `Bearer ${token}`)
    const update = await request(app)
      .put(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ user_id: userId, status: 'complete' })
    const completed = await request(app).get(`/orders/users/${userId}/completed`).set('Authorization', `Bearer ${token}`)
    const remove = await request(app).delete(`/orders/${orderId}`).set('Authorization', `Bearer ${token}`)

    expect(addProduct.status).toBe(201)
    expect(updateProduct.status).toBe(200)
    expect(updateProduct.body.quantity).toBe(3)
    expect(list.body.length).toBe(1)
    expect(show.body.status).toBe('active')
    expect(Number(show.body.total_amount)).toBe(9)
    expect(removeProduct.status).toBe(200)
    expect(afterProductRemoval.body.items).toEqual([])
    expect(Number(afterProductRemoval.body.total_amount)).toBe(0)
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
