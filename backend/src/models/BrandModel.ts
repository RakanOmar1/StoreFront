import pool from '../config/database'
import { Brand } from '../types/Brand'

export class BrandModel {
  async index(): Promise<Brand[]> {
    const result = await pool.query('SELECT * FROM brands ORDER BY name')
    return result.rows
  }

  async show(id: string): Promise<Brand> {
    const result = await pool.query('SELECT * FROM brands WHERE id = $1', [id])
    return result.rows[0]
  }

  async create(brand: Brand): Promise<Brand> {
    const result = await pool.query(
      'INSERT INTO brands (name, description, is_active) VALUES ($1, $2, $3) RETURNING *',
      [brand.name.trim(), brand.description || null, brand.is_active !== false]
    )
    return result.rows[0]
  }

  async update(id: string, brand: Brand): Promise<Brand> {
    const result = await pool.query(
      'UPDATE brands SET name = $1, description = $2, is_active = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [brand.name.trim(), brand.description || null, brand.is_active !== false, id]
    )
    return result.rows[0]
  }

  async delete(id: string): Promise<Brand> {
    const productCount = await pool.query('SELECT COUNT(*) FROM products WHERE brand_id = $1', [id])
    if (Number(productCount.rows[0].count) > 0) throw new Error('Cannot delete brand with products')
    const result = await pool.query('DELETE FROM brands WHERE id = $1 RETURNING *', [id])
    return result.rows[0]
  }
}
