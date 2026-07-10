import pool from '../config/database'
import { ActivityLog, ActivityPage, ActivityQuery } from '../types/ActivityLog'

export class ActivityLogModel {
  async index(entityType: string, recordId: string | number, query: ActivityQuery = {}): Promise<ActivityPage> {
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))
    const values: (string | number)[] = [entityType.toUpperCase(), String(recordId)]
    const conditions = ['al.entity_type = $1', 'al.record_id = $2']

    if (query.eventType) {
      values.push(query.eventType)
      conditions.push(`al.event_type = $${values.length}`)
    }

    const where = conditions.join(' AND ')
    const total = await pool.query(`SELECT COUNT(*) FROM activity_logs al WHERE ${where}`, values)
    values.push(pageSize, (page - 1) * pageSize)

    const result = await pool.query(
      `SELECT
         al.*,
         COALESCE(u.name, TRIM(COALESCE(u.firstname, '') || ' ' || COALESCE(u.lastname, ''))) AS created_by_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.created_by_user_id
       WHERE ${where}
       ORDER BY al.created_at DESC, al.id DESC
       LIMIT $${values.length - 1}
       OFFSET $${values.length}`,
      values
    )

    return {
      items: result.rows,
      page,
      pageSize,
      total: Number(total.rows[0].count)
    }
  }

  async all(query: ActivityQuery & { entityType?: string; recordId?: string; search?: string } = {}): Promise<ActivityPage> {
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))
    const values: (string | number)[] = []
    const conditions: string[] = []

    if (query.entityType) {
      values.push(query.entityType.toUpperCase())
      conditions.push(`al.entity_type = $${values.length}`)
    }
    if (query.recordId) {
      values.push(String(query.recordId))
      conditions.push(`al.record_id = $${values.length}`)
    }
    if (query.eventType) {
      values.push(query.eventType)
      conditions.push(`al.event_type = $${values.length}`)
    }
    if (query.search) {
      values.push(`%${query.search}%`)
      conditions.push(`(LOWER(COALESCE(al.message, '')) LIKE LOWER($${values.length}) OR LOWER(COALESCE(al.field_name, '')) LIKE LOWER($${values.length}))`)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const total = await pool.query(`SELECT COUNT(*) FROM activity_logs al ${where}`, values)
    values.push(pageSize, (page - 1) * pageSize)

    const result = await pool.query(
      `SELECT
         al.*,
         COALESCE(u.name, TRIM(COALESCE(u.firstname, '') || ' ' || COALESCE(u.lastname, ''))) AS created_by_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.created_by_user_id
       ${where}
       ORDER BY al.created_at DESC, al.id DESC
       LIMIT $${values.length - 1}
       OFFSET $${values.length}`,
      values
    )

    return {
      items: result.rows,
      page,
      pageSize,
      total: Number(total.rows[0].count)
    }
  }

  async create(log: ActivityLog): Promise<ActivityLog> {
    const result = await pool.query(
      `INSERT INTO activity_logs
        (entity_type, record_id, event_type, message, field_name, old_value, new_value, metadata, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        log.entity_type.toUpperCase(),
        String(log.record_id),
        log.event_type,
        log.message || null,
        log.field_name || null,
        log.old_value ?? null,
        log.new_value ?? null,
        log.metadata ? JSON.stringify(log.metadata) : null,
        log.created_by_user_id || null
      ]
    )

    return result.rows[0]
  }

  async recordExists(entityType: string, recordId: string | number): Promise<boolean> {
    const table = this.tableFor(entityType)
    if (!table) {
      return false
    }

    const result = await pool.query(`SELECT 1 FROM ${table} WHERE id = $1 LIMIT 1`, [recordId])
    return Boolean(result.rows[0])
  }

  private tableFor(entityType: string): string | null {
    const map: Record<string, string> = {
      PRODUCT: 'products',
      CATEGORY: 'categories',
      ORDER: 'orders',
      USER: 'users',
      ADMIN_ACCOUNT: 'users',
      PROMOTION: 'promotions'
    }

    return map[entityType.toUpperCase()] || null
  }
}
