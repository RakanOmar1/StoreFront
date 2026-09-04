import request from 'supertest'
import app from '../../server'
import { ProductModel } from '../../models/ProductModel'
import { clearTables, createTables } from '../helpers/db'

describe('Product catalog sorting', () => {
  const products = new ProductModel()

  beforeAll(async () => createTables())
  beforeEach(async () => {
    await clearTables()
    await products.create({ name: 'Zulu', price: 30 })
    await products.create({ name: 'Alpha', price: 10 })
    await products.create({ name: 'Middle', price: 20 })
  })
  afterAll(async () => clearTables())

  it('sorts the full result set before applying limit and offset', async () => {
    const page = await products.index({ sort: 'price-desc', limit: 2, offset: 1 })
    expect(page.map(product => product.price)).toEqual([20, 10])
  })

  it('uses stable name ordering and rejects unsupported sort values', async () => {
    const sorted = await request(app).get('/products?sort=name&limit=2')
    const rejected = await request(app).get('/products?sort=unsupported')
    expect(sorted.body.map((product: { name: string }) => product.name)).toEqual(['Alpha', 'Middle'])
    expect(rejected.status).toBe(400)
  })
})
