import pool from '../config/database'
import { Product } from '../types/Product'

export class ProductModel {
  async index(): Promise<Product[]> {
    const result = await pool.query('SELECT * FROM products ORDER BY id')
    return result.rows
  }

  async show(id: string): Promise<Product> {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id])
    return result.rows[0]
  }

  async create(product: Product): Promise<Product> {
    const result = await pool.query(
      'INSERT INTO products (name, price, category) VALUES ($1, $2, $3) RETURNING *',
      [product.name, product.price, product.category]
    )
    return result.rows[0]
  }

  async update(id: string, product: Product): Promise<Product> {
    const result = await pool.query(
      'UPDATE products SET name = $1, price = $2, category = $3 WHERE id = $4 RETURNING *',
      [product.name, product.price, product.category, id]
    )
    return result.rows[0]
  }

  async delete(id: string): Promise<Product> {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id])
    return result.rows[0]
  }

  async popularProducts(): Promise<Product[]> {
    const result = await pool.query(
      `SELECT products.id, products.name, products.price, products.category
       FROM products
       JOIN order_products ON products.id = order_products.product_id
       GROUP BY products.id
       ORDER BY SUM(order_products.quantity) DESC
       LIMIT 5`
    )
    return result.rows
  }
}
