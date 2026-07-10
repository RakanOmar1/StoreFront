import pool from '../config/database'
import { Promotion } from '../types/Promotion'

export class PromotionModel {
  async index(): Promise<Promotion[]> {
    const result = await pool.query(`
      SELECT pr.*, COUNT(p.id)::INT AS product_count
      FROM promotions pr
      LEFT JOIN products p ON p.promotion_id = pr.id
      GROUP BY pr.id
      ORDER BY pr.id
    `)
    return result.rows
  }

  async show(id: string): Promise<Promotion> {
    const result = await pool.query('SELECT * FROM promotions WHERE id = $1', [id])
    return result.rows[0] ? this.withProducts(result.rows[0]) : result.rows[0]
  }

  async create(promotion: Promotion): Promise<Promotion> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const productIds = await this.resolvedProductIds(client, promotion.productIds || [], promotion.categoryIds || [])
      const categoryIds = await this.validCategoryIds(client, promotion.categoryIds || [])
      const result = await client.query(
        'INSERT INTO promotions (name, type, value, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
        [promotion.name, promotion.type, promotion.value, promotion.is_active ?? true]
      )
      await this.assignCategories(client, result.rows[0].id, categoryIds)
      await this.assignProducts(client, result.rows[0].id, productIds)
      await client.query('COMMIT')
      return this.show(String(result.rows[0].id))
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async update(id: string, promotion: Promotion): Promise<Promotion> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const productIds = await this.resolvedProductIds(client, promotion.productIds || [], promotion.categoryIds || [])
      const categoryIds = await this.validCategoryIds(client, promotion.categoryIds || [])
      const result = await client.query(
        'UPDATE promotions SET name = $1, type = $2, value = $3, is_active = $4 WHERE id = $5 RETURNING *',
        [promotion.name, promotion.type, promotion.value, promotion.is_active ?? true, id]
      )
      if (!result.rows[0]) {
        await client.query('ROLLBACK')
        return result.rows[0]
      }
      await this.assignCategories(client, Number(id), categoryIds)
      await this.assignProducts(client, Number(id), productIds)
      await client.query('COMMIT')
      return this.show(id)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async delete(id: string): Promise<Promotion> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('UPDATE products SET promotion_id = NULL, updated_at = NOW() WHERE promotion_id = $1', [id])
      const result = await client.query('DELETE FROM promotions WHERE id = $1 RETURNING *', [id])
      await client.query('COMMIT')
      return result.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async products(id: string) {
    const result = await pool.query(
      `SELECT p.id, p.name, p.price, p.category, p.category_id, p.url
       FROM products p
       WHERE p.promotion_id = $1
       ORDER BY p.name`,
      [id]
    )
    return result.rows
  }

  private async withProducts(promotion: Promotion): Promise<Promotion> {
    const products = await this.products(String(promotion.id))
    const categoryIds = await this.categoryIds(String(promotion.id))
    return {
      ...promotion,
      productIds: products.map(product => Number(product.id)),
      categoryIds,
      products
    }
  }

  private async categoryIds(id: string): Promise<number[]> {
    const result = await pool.query(
      'SELECT category_id FROM promotion_categories WHERE promotion_id = $1 ORDER BY category_id',
      [id]
    )
    return result.rows.map(row => Number(row.category_id))
  }

  private async resolvedProductIds(client: Pick<typeof pool, 'query'>, productIds: unknown[], categoryIds: unknown[]): Promise<number[]> {
    const explicitProductIds = await this.validProductIds(client, productIds)
    const validCategoryIds = await this.validCategoryIds(client, categoryIds)

    if (validCategoryIds.length === 0) {
      return explicitProductIds
    }

    const result = await client.query(
      'SELECT id FROM products WHERE category_id = ANY($1::BIGINT[])',
      [validCategoryIds]
    )
    const categoryProductIds = result.rows.map(row => Number(row.id))
    return Array.from(new Set([...explicitProductIds, ...categoryProductIds]))
  }

  private async validProductIds(client: Pick<typeof pool, 'query'>, productIds: unknown[]): Promise<number[]> {
    const ids = Array.from(new Set((productIds || []).map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0)))
    if (ids.length === 0) {
      return []
    }

    const result = await client.query('SELECT id FROM products WHERE id = ANY($1::BIGINT[])', [ids])
    const existingIds = result.rows.map(row => Number(row.id))
    if (existingIds.length !== ids.length) {
      throw new Error('Invalid product IDs')
    }

    return ids
  }

  private async validCategoryIds(client: Pick<typeof pool, 'query'>, categoryIds: unknown[]): Promise<number[]> {
    const ids = Array.from(new Set((categoryIds || []).map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0)))
    if (ids.length === 0) {
      return []
    }

    const result = await client.query('SELECT id FROM categories WHERE id = ANY($1::BIGINT[])', [ids])
    const existingIds = result.rows.map(row => Number(row.id))
    if (existingIds.length !== ids.length) {
      throw new Error('Invalid category IDs')
    }

    return ids
  }

  private async assignCategories(client: Pick<typeof pool, 'query'>, promotionId: number, categoryIds: number[]): Promise<void> {
    await client.query('DELETE FROM promotion_categories WHERE promotion_id = $1', [promotionId])
    if (categoryIds.length > 0) {
      await client.query(
        `INSERT INTO promotion_categories (promotion_id, category_id)
         SELECT $1, unnest($2::BIGINT[])
         ON CONFLICT (promotion_id, category_id) DO NOTHING`,
        [promotionId, categoryIds]
      )
    }
  }

  private async assignProducts(client: Pick<typeof pool, 'query'>, promotionId: number, productIds: number[]): Promise<void> {
    await client.query('UPDATE products SET promotion_id = NULL, updated_at = NOW() WHERE promotion_id = $1', [promotionId])
    if (productIds.length > 0) {
      await client.query(
        'UPDATE products SET promotion_id = $1, updated_at = NOW() WHERE id = ANY($2::BIGINT[])',
        [promotionId, productIds]
      )
    }
  }
}
