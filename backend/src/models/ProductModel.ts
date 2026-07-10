import pool from '../config/database'
import { Product, ProductFilters, ProductQuery } from '../types/Product'

export class ProductModel {
  private productSelect = `
    SELECT
      p.*,
      c.name AS category,
      pr.id AS promotion_id,
      pr.name AS promotion_name,
      pr.type AS promotion_type,
      pr.value AS promotion_value,
      pr.is_active AS promotion_is_active
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN promotions pr ON pr.id = p.promotion_id
  `

  async index(filters: ProductQuery = {}): Promise<Product[]> {
    const values: (string | number)[] = []
    const conditions: string[] = []

    if (filters.search) {
      values.push(`%${filters.search}%`)
      conditions.push(`LOWER(p.name) LIKE LOWER($${values.length})`)
    }

    if (filters.category) {
      values.push(filters.category)
      conditions.push(`COALESCE(c.name, p.category) = $${values.length}`)
    }

    if (typeof filters.maxPrice === 'number') {
      values.push(filters.maxPrice)
      conditions.push(`p.price <= $${values.length}`)
    }

    let query = this.productSelect

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    query += ' ORDER BY p.id'

    if (typeof filters.limit === 'number') {
      values.push(filters.limit)
      query += ` LIMIT $${values.length}`
    }

    if (typeof filters.offset === 'number') {
      values.push(filters.offset)
      query += ` OFFSET $${values.length}`
    }

    const result = await pool.query(query, values)
    return result.rows.map(this.mapProduct)
  }

  async show(id: string): Promise<Product> {
    const result = await pool.query(`${this.productSelect} WHERE p.id = $1`, [id])
    return result.rows[0] ? this.mapProduct(result.rows[0]) : result.rows[0]
  }

  async create(product: Product): Promise<Product> {
    const categoryId = await this.resolveCategoryId(product)
    const images = this.normalizeImages(product)
    const mainImage = product.url || images[0] || null
    const result = await pool.query(
      `INSERT INTO products (name, price, category, description, url, images, category_id, promotion_id)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
       RETURNING *`,
      [product.name, product.price, product.category || null, product.description || null, mainImage, JSON.stringify(images), categoryId, product.promotion_id || null]
    )
    return this.show(String(result.rows[0].id))
  }

  async update(id: string, product: Product): Promise<Product> {
    const categoryId = await this.resolveCategoryId(product)
    const existing = await this.show(id)
    const promotionId = Object.prototype.hasOwnProperty.call(product, 'promotion_id')
      ? product.promotion_id || null
      : existing?.promotion_id || null
    const images = this.normalizeImages(product, existing?.images || [])
    const mainImage = product.url || images[0] || null
    const result = await pool.query(
      `UPDATE products
       SET name = $1, price = $2, category = $3, description = $4, url = $5, images = $6::jsonb, category_id = $7, promotion_id = $8, updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [product.name, product.price, product.category || null, product.description || null, mainImage, JSON.stringify(images), categoryId, promotionId, id]
    )
    return result.rows[0] ? this.show(id) : result.rows[0]
  }

  async delete(id: string): Promise<Product> {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id])
    return result.rows[0]
  }

  async popularProducts(): Promise<Product[]> {
    const result = await pool.query(
      `${this.productSelect}
       JOIN order_products op ON p.id = op.product_id
       GROUP BY p.id, c.name, pr.id
       ORDER BY SUM(op.quantity) DESC
       LIMIT 5`
    )
    return result.rows.map(this.mapProduct)
  }

  async filters(): Promise<ProductFilters> {
    const categories = await pool.query(
      `SELECT DISTINCT COALESCE(c.name, p.category) AS category
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE COALESCE(c.name, p.category) IS NOT NULL
       ORDER BY category`
    )
    const maxPrice = await pool.query('SELECT COALESCE(MAX(price), 0) AS max_price FROM products')

    return {
      categories: categories.rows.map(row => row.category),
      maxPrice: Number(maxPrice.rows[0].max_price)
    }
  }

  private async resolveCategoryId(product: Product): Promise<number | null> {
    if (product.category_id) {
      return product.category_id
    }

    if (!product.category) {
      return null
    }

    const existing = await pool.query('SELECT id FROM categories WHERE name = $1', [product.category])
    if (existing.rows[0]) {
      return existing.rows[0].id
    }

    const created = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [product.category])
    return created.rows[0].id
  }

  private mapProduct = (row: any): Product => {
    const price = Number(row.price)
    const promotion = row.promotion_id
      ? {
          id: Number(row.promotion_id),
          name: row.promotion_name,
          type: row.promotion_type,
          value: Number(row.promotion_value),
          is_active: row.promotion_is_active
        }
      : null
    let finalPrice = price

    if (promotion?.is_active) {
      finalPrice = promotion.type === 'FIXED'
        ? price - promotion.value
        : price - ((price * promotion.value) / 100)
    }

    return {
      id: row.id,
      name: row.name,
      price,
      description: row.description,
      url: row.url,
      images: this.rowImages(row),
      category: row.category,
      category_id: row.category_id ? Number(row.category_id) : null,
      promotion_id: row.promotion_id ? Number(row.promotion_id) : null,
      promotion,
      finalPrice: Math.max(0, finalPrice),
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }

  private normalizeImages(product: Product, fallback: string[] = []): string[] {
    const rawImages = Array.isArray(product.images) ? product.images : fallback
    const images = rawImages
      .map(image => String(image || '').trim())
      .filter(Boolean)

    if (product.url) {
      images.unshift(String(product.url).trim())
    }

    return Array.from(new Set(images)).slice(0, 5)
  }

  private rowImages(row: any): string[] {
    const rawImages: unknown[] = Array.isArray(row.images)
      ? row.images
      : typeof row.images === 'string'
        ? safeJsonArray(row.images)
        : []
    const images: string[] = rawImages.map((image: unknown) => String(image || '').trim()).filter(Boolean)

    if (row.url) {
      images.unshift(String(row.url).trim())
    }

    return Array.from(new Set(images)).slice(0, 5)
  }
}

function safeJsonArray(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
