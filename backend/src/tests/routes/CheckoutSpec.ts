import request from 'supertest'
import app from '../../server'
import pool from '../../config/database'
import { clearTables, createTables } from '../helpers/db'

describe('Customer checkout journey', () => {
  let token: string
  let productId: number

  beforeAll(async () => {
    await createTables()
  })

  beforeEach(async () => {
    await clearTables()
    const signup = await request(app)
      .post('/auth/register')
      .send({
        firstname: 'Checkout',
        lastname: 'Customer',
        email: 'checkout@example.com',
        password: 'secret',
        address: 'Al Manara',
        city: 'Ramallah',
        latitude: 31.9038,
        longitude: 35.2034
      })
    token = signup.body.token
    const product = await pool.query(
      `INSERT INTO products (name, price, category)
       VALUES ('Checkout product', 9.50, 'test') RETURNING id`
    )
    productId = Number(product.rows[0].id)
  })

  afterAll(async () => {
    await clearTables()
  })

  it('checks out a cash delivery with exact coordinates and clears the cart', async () => {
    await request(app)
      .post('/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 2 })

    const checkout = await request(app)
      .post('/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        paymentMethod: 'CASH',
        deliveryType: 'DELIVERY',
        deliveryAddress: 'Al Manara, Ramallah',
        deliveryLatitude: 31.9038,
        deliveryLongitude: 35.2034
      })

    expect(checkout.status).toBe(201)
    expect(Number(checkout.body.order.total_amount)).toBe(19)
    expect(checkout.body.order.payment_status).toBe('PENDING')
    expect(Number(checkout.body.order.delivery_latitude)).toBe(31.9038)
    expect(Number(checkout.body.order.delivery_longitude)).toBe(35.2034)

    const order = await request(app)
      .get(`/orders/${checkout.body.order.id}`)
      .set('Authorization', `Bearer ${token}`)
    const cart = await request(app)
      .get('/cart')
      .set('Authorization', `Bearer ${token}`)

    expect(order.status).toBe(200)
    expect(order.body.items.length).toBe(1)
    expect(order.body.items[0].quantity).toBe(2)
    expect(cart.body.items).toEqual([])
  })

  it('rejects delivery checkout without a precise map point and keeps the cart', async () => {
    await request(app)
      .post('/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 1 })

    const checkout = await request(app)
      .post('/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        paymentMethod: 'CASH',
        deliveryType: 'DELIVERY',
        deliveryAddress: 'Ramallah'
      })
    const cart = await request(app)
      .get('/cart')
      .set('Authorization', `Bearer ${token}`)

    expect(checkout.status).toBe(400)
    expect(cart.body.items.length).toBe(1)
  })
})
