import pool from '../config/database'
import { Product, ProductFilters, ProductQuery } from '../types/Product'

export class ProductModel {
  async index(filters: ProductQuery = {}): Promise<Product[]> {
    const values: (string | number)[] = []
    const conditions: string[] = []

    if (filters.search) {
      values.push(`%${filters.search}%`)
      conditions.push(`LOWER(name) LIKE LOWER($${values.length})`)
    }

    if (filters.category) {
      values.push(filters.category)
      conditions.push(`category = $${values.length}`)
    }

    if (typeof filters.maxPrice === 'number') {
      values.push(filters.maxPrice)
      conditions.push(`price <= $${values.length}`)
    }

    let query = 'SELECT * FROM products'

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    query += ' ORDER BY id'

    if (typeof filters.limit === 'number') {
      values.push(filters.limit)
      query += ` LIMIT $${values.length}`
    }

    if (typeof filters.offset === 'number') {
      values.push(filters.offset)
      query += ` OFFSET $${values.length}`
    }

    const result = await pool.query(query, values)
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

  async filters(): Promise<ProductFilters> {
    const categories = await pool.query(
      'SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category'
    )
    const maxPrice = await pool.query('SELECT COALESCE(MAX(price), 0) AS max_price FROM products')

    return {
      categories: categories.rows.map(row => row.category),
      maxPrice: Number(maxPrice.rows[0].max_price)
    }
  }
}
