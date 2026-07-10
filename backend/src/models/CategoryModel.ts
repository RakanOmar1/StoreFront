import pool from '../config/database'
import { Category } from '../types/Category'

export class CategoryModel {
  async index(): Promise<Category[]> {
    const result = await pool.query('SELECT * FROM categories ORDER BY name')
    return result.rows
  }

  async show(id: string): Promise<Category> {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id])
    return result.rows[0]
  }

  async create(category: Category): Promise<Category> {
    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [category.name, category.description || null]
    )
    return result.rows[0]
  }

  async update(id: string, category: Category): Promise<Category> {
    const result = await pool.query(
      'UPDATE categories SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [category.name, category.description || null, id]
    )
    return result.rows[0]
  }

  async delete(id: string): Promise<Category> {
    const productCount = await pool.query('SELECT COUNT(*) FROM products WHERE category_id = $1', [id])

    if (Number(productCount.rows[0].count) > 0) {
      throw new Error('Cannot delete category with products')
    }

    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id])
    return result.rows[0]
  }
}
