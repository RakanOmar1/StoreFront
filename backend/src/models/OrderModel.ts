import pool from '../config/database'
import { CheckoutPayload, Order, OrderProduct } from '../types/Order'

export class OrderModel {
  async index(): Promise<Order[]> {
    const result = await pool.query('SELECT * FROM orders ORDER BY id')
    return result.rows
  }

  async show(id: string): Promise<Order> {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id])
    return result.rows[0]
  }

  async create(order: Order): Promise<Order> {
    const result = await pool.query(
      `INSERT INTO orders (user_id, status, total_amount, payment_status, payment_method, delivery_type, delivery_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        order.user_id,
        order.status || 'PENDING',
        order.total_amount || 0,
        order.payment_status || 'PENDING',
        order.payment_method || 'CASH',
        order.delivery_type || 'PICKUP',
        order.delivery_address || null
      ]
    )
    return result.rows[0]
  }

  async update(id: string, order: Order): Promise<Order> {
    const result = await pool.query(
      `UPDATE orders
       SET user_id = $1, status = $2, payment_status = $3, payment_method = $4, delivery_type = $5, delivery_address = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        order.user_id,
        order.status,
        order.payment_status || 'PENDING',
        order.payment_method || 'CASH',
        order.delivery_type || 'PICKUP',
        order.delivery_address || null,
        id
      ]
    )
    return result.rows[0]
  }

  async delete(id: string): Promise<Order> {
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id])
    return result.rows[0]
  }

  async addProduct(orderId: string, productId: string, quantity: number): Promise<OrderProduct> {
    const result = await pool.query(
      'INSERT INTO order_products (order_id, product_id, quantity, price) VALUES ($1, $2, $3, COALESCE((SELECT price FROM products WHERE id = $2::BIGINT), 0)) RETURNING *',
      [orderId, productId, quantity]
    )
    return result.rows[0]
  }

  async currentOrderByUser(userId: string): Promise<Order[]> {
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 AND status IN ($2, $3) ORDER BY id',
      [userId, 'active', 'PENDING']
    )
    return result.rows
  }

  async completedOrdersByUser(userId: string): Promise<Order[]> {
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 AND status IN ($2, $3) ORDER BY id',
      [userId, 'complete', 'DELIVERED']
    )
    return result.rows
  }

  async checkout(userId: number, payload: CheckoutPayload): Promise<{ message: string; order: Order }> {
    if (payload.deliveryType === 'DELIVERY' && !payload.deliveryAddress) {
      throw new Error('Delivery address is required for delivery orders')
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const cart = await client.query('SELECT * FROM carts WHERE user_id = $1', [userId])
      if (!cart.rows[0]) {
        throw new Error('Cart is empty')
      }

      const items = await client.query(
        `SELECT ci.product_id, ci.quantity, p.price, pr.type, pr.value, pr.is_active
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
         LEFT JOIN promotions pr ON pr.id = p.promotion_id
         WHERE ci.cart_id = $1`,
        [cart.rows[0].id]
      )

      if (items.rows.length === 0) {
        throw new Error('Cart is empty')
      }

      let total = 0
      const orderItems = items.rows.map(item => {
        const price = this.finalPrice(Number(item.price), item.type, Number(item.value), item.is_active)
        total += price * Number(item.quantity)
        return { productId: item.product_id, quantity: item.quantity, price }
      })

      const order = await client.query(
        `INSERT INTO orders (user_id, total_amount, status, payment_status, payment_method, delivery_type, delivery_address)
         VALUES ($1, $2, 'PENDING', 'PENDING', $3, $4, $5)
         RETURNING *`,
        [
          userId,
          total,
          payload.paymentMethod,
          payload.deliveryType,
          payload.deliveryType === 'DELIVERY' ? payload.deliveryAddress : null
        ]
      )

      for (const item of orderItems) {
        await client.query(
          'INSERT INTO order_products (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [order.rows[0].id, item.productId, item.quantity, item.price]
        )
      }

      await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.rows[0].id])
      await client.query('COMMIT')

      return {
        message: payload.paymentMethod === 'ONLINE'
          ? 'Payment integration will be handled later. Order is currently PENDING.'
          : 'Order created successfully. Please pay with cash upon delivery/pickup.',
        order: order.rows[0]
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  private finalPrice(price: number, type?: string, value?: number, isActive?: boolean): number {
    if (!isActive) {
      return price
    }

    const discounted = type === 'FIXED'
      ? price - (value || 0)
      : type === 'PERCENT'
        ? price - ((price * (value || 0)) / 100)
        : price

    return Math.max(0, discounted)
  }
}
