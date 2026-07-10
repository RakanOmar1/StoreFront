import pool from '../config/database'
import { Cart, CartItem } from '../types/Cart'

export class CartModel {
  async getCart(userId: string | number): Promise<Cart> {
    const cart = await this.findOrCreateCart(userId)
    const items = await this.getItems(cart.id as number)
    return { ...cart, items }
  }

  async addItem(userId: string | number, productId: string | number, quantity = 1): Promise<CartItem> {
    const cart = await this.findOrCreateCart(userId)
    const amount = Math.max(1, Number(quantity) || 1)

    const result = await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = NOW()
       RETURNING *`,
      [cart.id, productId, amount]
    )

    return result.rows[0]
  }

  async updateItem(userId: string | number, productId: string | number, quantity: number): Promise<CartItem | { message: string }> {
    if (Number(quantity) <= 0) {
      return this.removeItem(userId, productId)
    }

    const cart = await this.findOrCreateCart(userId)
    const result = await pool.query(
      `UPDATE cart_items SET quantity = $1, updated_at = NOW()
       WHERE cart_id = $2 AND product_id = $3
       RETURNING *`,
      [quantity, cart.id, productId]
    )
    return result.rows[0]
  }

  async removeItem(userId: string | number, productId: string | number): Promise<{ message: string }> {
    const cart = await this.findOrCreateCart(userId)
    await pool.query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cart.id, productId])
    return { message: 'Item removed from cart successfully' }
  }

  async clearCart(cartId: number): Promise<void> {
    await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId])
  }

  private async findOrCreateCart(userId: string | number): Promise<Cart> {
    const existing = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId])
    if (existing.rows[0]) {
      return existing.rows[0]
    }

    const created = await pool.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING *', [userId])
    return created.rows[0]
  }

  private async getItems(cartId: number): Promise<CartItem[]> {
    const result = await pool.query(
      `SELECT
        ci.*,
        p.name,
        p.price,
        p.description,
        p.url,
        COALESCE(c.name, p.category) AS category,
        pr.id AS promotion_id,
        pr.name AS promotion_name,
        pr.type AS promotion_type,
        pr.value AS promotion_value,
        pr.is_active AS promotion_is_active
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN promotions pr ON pr.id = p.promotion_id
       WHERE ci.cart_id = $1
       ORDER BY ci.id`,
      [cartId]
    )

    return result.rows.map(row => {
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

      return {
        id: row.id,
        cart_id: row.cart_id,
        product_id: row.product_id,
        quantity: row.quantity,
        created_at: row.created_at,
        updated_at: row.updated_at,
        product: {
          id: row.product_id,
          name: row.name,
          price,
          description: row.description,
          url: row.url,
          category: row.category,
          promotion_id: row.promotion_id ? Number(row.promotion_id) : null,
          promotion,
          finalPrice: this.finalPrice(price, promotion?.type, promotion?.value, promotion?.is_active)
        }
      }
    })
  }

  private finalPrice(price: number, type?: string, value?: number, isActive?: boolean): number {
    if (!isActive || !type || !value) {
      return price
    }

    const finalPrice = type === 'FIXED'
      ? price - value
      : price - ((price * value) / 100)

    return Math.max(0, finalPrice)
  }
}
