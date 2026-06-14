import { OrderModel } from '../../models/OrderModel'
import { ProductModel } from '../../models/ProductModel'
import { UserModel } from '../../models/UserModel'
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
})
