import pool from '../config/database'

export interface RevenueAggregateRow {
  bucket_key: string
  revenue: string
}

export interface StatusAggregateRow {
  status: string
  order_count: string
}

export interface CategoryAggregateRow {
  category_id: number | null
  category_name: string | null
  revenue: string
  units_sold: string
}

export interface ProductAggregateRow {
  product_id: number | null
  product_name: string | null
  units_sold: string
  revenue: string
}

export class AdminAnalyticsRepository {
  async revenue(bucket: 'day' | 'month', startDate: Date, endDate: Date, excludedStatuses: string[], excludedPayments: string[]): Promise<RevenueAggregateRow[]> {
    const result = await pool.query(
      `SELECT TO_CHAR(DATE_TRUNC($1, created_at), 'YYYY-MM-DD') AS bucket_key,
              COALESCE(SUM(total_amount), 0)::TEXT AS revenue
       FROM orders
       WHERE created_at >= $2
         AND created_at < $3
         AND UPPER(status::TEXT) <> ALL($4::TEXT[])
         AND UPPER(payment_status::TEXT) <> ALL($5::TEXT[])
         AND total_amount > 0
       GROUP BY DATE_TRUNC($1, created_at)
       ORDER BY bucket_key`,
      [bucket, startDate, endDate, excludedStatuses, excludedPayments]
    )

    return result.rows
  }

  async totalRevenue(startDate: Date, endDate: Date, excludedStatuses: string[], excludedPayments: string[]): Promise<number> {
    const result = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0)::TEXT AS revenue
       FROM orders
       WHERE created_at >= $1
         AND created_at < $2
         AND UPPER(status::TEXT) <> ALL($3::TEXT[])
         AND UPPER(payment_status::TEXT) <> ALL($4::TEXT[])
         AND total_amount > 0`,
      [startDate, endDate, excludedStatuses, excludedPayments]
    )

    return Number(result.rows[0]?.revenue) || 0
  }

  async ordersByStatus(): Promise<StatusAggregateRow[]> {
    const result = await pool.query(
      `SELECT status, COUNT(*)::TEXT AS order_count
       FROM orders
       GROUP BY status`
    )

    return result.rows
  }

  async salesByCategory(startDate: Date, endDate: Date, limit: number, excludedStatuses: string[], excludedPayments: string[]): Promise<CategoryAggregateRow[]> {
    const result = await pool.query(
      `SELECT c.id AS category_id,
              COALESCE(c.name, p.category, 'Uncategorized') AS category_name,
              COALESCE(SUM(op.quantity * op.price), 0)::TEXT AS revenue,
              COALESCE(SUM(op.quantity), 0)::TEXT AS units_sold
       FROM order_products op
       JOIN orders o ON o.id = op.order_id
       LEFT JOIN products p ON p.id = op.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE o.created_at >= $1
         AND o.created_at < $2
         AND UPPER(o.status::TEXT) <> ALL($3::TEXT[])
         AND UPPER(o.payment_status::TEXT) <> ALL($4::TEXT[])
       GROUP BY c.id, COALESCE(c.name, p.category, 'Uncategorized')
       ORDER BY COALESCE(SUM(op.quantity * op.price), 0) DESC
       LIMIT $5`,
      [startDate, endDate, excludedStatuses, excludedPayments, limit]
    )

    return result.rows
  }

  async topProducts(startDate: Date, endDate: Date, limit: number, excludedStatuses: string[], excludedPayments: string[]): Promise<ProductAggregateRow[]> {
    const result = await pool.query(
      `SELECT p.id AS product_id,
              COALESCE(p.name, CONCAT('Product #', op.product_id)) AS product_name,
              COALESCE(SUM(op.quantity), 0)::TEXT AS units_sold,
              COALESCE(SUM(op.quantity * op.price), 0)::TEXT AS revenue
       FROM order_products op
       JOIN orders o ON o.id = op.order_id
       LEFT JOIN products p ON p.id = op.product_id
       WHERE o.created_at >= $1
         AND o.created_at < $2
         AND UPPER(o.status::TEXT) <> ALL($3::TEXT[])
         AND UPPER(o.payment_status::TEXT) <> ALL($4::TEXT[])
       GROUP BY p.id, COALESCE(p.name, CONCAT('Product #', op.product_id))
       ORDER BY COALESCE(SUM(op.quantity), 0) DESC, COALESCE(SUM(op.quantity * op.price), 0) DESC
       LIMIT $5`,
      [startDate, endDate, excludedStatuses, excludedPayments, limit]
    )

    return result.rows
  }
}
