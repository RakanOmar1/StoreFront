import { OrderModel } from '../../models/OrderModel'
import { ProductModel } from '../../models/ProductModel'
import { UserModel } from '../../models/UserModel'
import { createTables, clearTables } from '../helpers/db'

const model = new ProductModel()
const userModel = new UserModel()
const orderModel = new OrderModel()

describe('ProductModel', () => {
  beforeAll(async () => {
    await createTables()
  })

  beforeEach(async () => {
    await clearTables()
  })

  afterAll(async () => {
    await clearTables()
  })

  it('creates, indexes, and shows products', async () => {
    await model.create({ name: 'Book', price: 20, category: 'media' })

    const products = await model.index()
    const product = await model.show('1')

    expect(products.length).toBe(1)
    expect(product.name).toBe('Book')
  })

  it('filters and paginates products', async () => {
    await model.create({ name: 'Trail Runner', price: 90, category: 'running' })
    await model.create({ name: 'City Boot', price: 140, category: 'boots' })
    await model.create({ name: 'Road Runner', price: 120, category: 'running' })

    const filtered = await model.index({ search: 'runner', category: 'running', maxPrice: 100, limit: 50, offset: 0 })
    const page = await model.index({ limit: 1, offset: 1 })

    expect(filtered.length).toBe(1)
    expect(filtered[0].name).toBe('Trail Runner')
    expect(page[0].name).toBe('City Boot')
  })

  it('returns product filter metadata', async () => {
    await model.create({ name: 'Trail Runner', price: 90, category: 'running' })
    await model.create({ name: 'City Boot', price: 140, category: 'boots' })

    const filters = await model.filters()

    expect(filters.categories).toEqual(['boots', 'running'])
    expect(filters.maxPrice).toBe(140)
  })

  it('updates and deletes products', async () => {
    await model.create({ name: 'Mug', price: 8, category: 'kitchen' })

    const updated = await model.update('1', { name: 'Travel Mug', price: 12, category: 'kitchen' })
    const deleted = await model.delete('1')

    expect(updated.name).toBe('Travel Mug')
    expect(deleted.price).toBe(12)
  })

  it('gets popular products', async () => {
    const user = await userModel.create({ firstname: 'Test', lastname: 'User', password: 'pass' })
    const product = await model.create({ name: 'Chair', price: 45, category: 'home' })
    const order = await orderModel.create({ user_id: user.id as number, status: 'active' })

    await orderModel.addProduct(String(order.id), String(product.id), 3)
    const popular = await model.popularProducts()

    expect(popular[0].name).toBe('Chair')
  })
})
