import dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'
const databaseUrl = process.env.DATABASE_URL

if (isProduction && !databaseUrl) {
  throw new Error('DATABASE_URL must be configured in production')
}

const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: isProduction ? { rejectUnauthorized: false } : undefined,
      idleTimeoutMillis: 1000
    })
  : new Pool({
      host: process.env.POSTGRES_HOST || '127.0.0.1',
      database: process.env.ENV === 'test'
        ? process.env.POSTGRES_TEST_DB || 'storefront_test'
        : process.env.POSTGRES_DB || 'storefront',
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      port: Number(process.env.POSTGRES_PORT) || 5432,
      idleTimeoutMillis: 1000
    })

export default pool
