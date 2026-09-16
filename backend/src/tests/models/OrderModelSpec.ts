import { OrderModel } from '../../models/OrderModel'
import { ProductModel } from '../../models/ProductModel'
import { UserModel } from '../../models/UserModel'
import pool from '../../config/database'
import { createTables, clearTables } from '../helpers/db'

const model = new OrderModel()
const userModel = new UserModel()
const productModel = new ProductModel()

describe('OrderModel', () => {
  beforeAll(async () => {
    await createTables()
  })

  beforeEach(async () => {
    await clearTables()
  })

  afterAll(async () => {
    await clearTables()
  })

  it('creates, indexes, and shows orders', async () => {
    const user = await userModel.create({ firstname: 'Order', lastname: 'User', password: 'pass' })
    await model.create({ user_id: user.id as number, status: 'active' })

    const orders = await model.index()
    const order = await model.show('1')

    expect(orders.length).toBe(1)
    expect(order.status).toBe('active')
  })

  it('updates and deletes orders', async () => {
    const user = await userModel.create({ firstname: 'Order', lastname: 'User', password: 'pass' })
    await model.create({ user_id: user.id as number, status: 'active' })

    const updated = await model.update('1', { user_id: user.id as number, status: 'complete' })
    const deleted = await model.delete('1')

    expect(updated.status).toBe('complete')
    expect(deleted.id).toBe(1)
  })

  it('adds products and finds current and completed orders by user', async () => {
    const user = await userModel.create({ firstname: 'Cart', lastname: 'User', password: 'pass' })
    const product = await productModel.create({ name: 'Notebook', price: 6, category: 'office' })
    const activeOrder = await model.create({ user_id: user.id as number, status: 'active' })
    await model.create({ user_id: user.id as number, status: 'complete' })

    const orderProduct = await model.addProduct(String(activeOrder.id), String(product.id), 2)
    const current = await model.currentOrderByUser(String(user.id))
    const completed = await model.completedOrdersByUser(String(user.id))

    expect(orderProduct.quantity).toBe(2)
    expect(current.length).toBe(1)
    expect(completed.length).toBe(1)
  })

  it('updates and removes order lines while recalculating the order total', async () => {
    const user = await userModel.create({ firstname: 'Editable', lastname: 'Order', password: 'pass' })
    const product = await productModel.create({ name: 'Apples', price: 4, category: 'produce' })
    const order = await model.create({ user_id: user.id as number, status: 'PENDING' })
    const item = await model.addProduct(String(order.id), String(product.id), 2)

    await model.updateProduct(String(order.id), String(item.id), 5)
    let saved = await model.show(String(order.id))
    expect(saved.items?.[0].quantity).toBe(5)
    expect(Number(saved.total_amount)).toBe(20)

    await model.removeProduct(String(order.id), String(item.id))
    saved = await model.show(String(order.id))
    expect(saved.items).toEqual([])
    expect(Number(saved.total_amount)).toBe(0)
  })

  it('uses the catalog price for legacy zero-priced items without replacing saved prices', async () => {
    const user = await userModel.create({ firstname: 'Legacy', lastname: 'Order', password: 'pass' })
    const product = await productModel.create({ name: 'Yogurt', price: 12, category: 'dairy' })
    const legacyOrder = await model.create({ user_id: user.id as number, status: 'PENDING' })
    const pricedOrder = await model.create({ user_id: user.id as number, status: 'PENDING' })

    await pool.query(
      'INSERT INTO order_products (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4), ($5, $2, $6, $7)',
      [legacyOrder.id, product.id, 2, 0, pricedOrder.id, 1, 9]
    )

    const legacy = await model.show(String(legacyOrder.id))
    const priced = await model.show(String(pricedOrder.id))

    expect(Number(legacy.items?.[0].price)).toBe(12)
    expect(Number(priced.items?.[0].price)).toBe(9)
  })
})
