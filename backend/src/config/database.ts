import dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config()

const pool = new Pool({
  host: process.env.POSTGRES_HOST || '127.0.0.1',
  database: process.env.ENV === 'test'
    ? process.env.POSTGRES_TEST_DB || 'storefront_test'
    : process.env.POSTGRES_DB || 'storefront',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: Number(process.env.POSTGRES_PORT) || 5432,
  idleTimeoutMillis: 1000
})

export default pool
