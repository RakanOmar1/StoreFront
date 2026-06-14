import pool from '../config/database'
import { Order, OrderProduct } from '../types/Order'

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
      'INSERT INTO orders (user_id, status) VALUES ($1, $2) RETURNING *',
      [order.user_id, order.status]
    )
    return result.rows[0]
  }

  async update(id: string, order: Order): Promise<Order> {
    const result = await pool.query(
      'UPDATE orders SET user_id = $1, status = $2 WHERE id = $3 RETURNING *',
      [order.user_id, order.status, id]
    )
    return result.rows[0]
  }

  async delete(id: string): Promise<Order> {
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id])
    return result.rows[0]
  }

  async addProduct(orderId: string, productId: string, quantity: number): Promise<OrderProduct> {
    const result = await pool.query(
      'INSERT INTO order_products (order_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
      [orderId, productId, quantity]
    )
    return result.rows[0]
  }

  async currentOrderByUser(userId: string): Promise<Order[]> {
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 AND status = $2 ORDER BY id',
      [userId, 'active']
    )
    return result.rows
  }

  async completedOrdersByUser(userId: string): Promise<Order[]> {
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 AND status = $2 ORDER BY id',
      [userId, 'complete']
    )
    return result.rows
  }
}
