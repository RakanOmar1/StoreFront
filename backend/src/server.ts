import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from './config/swagger'
import authRoutes from './routes/authRoutes'
import activityLogRoutes from './routes/activityLogRoutes'
import adminAnalyticsRoutes from './routes/adminAnalyticsRoutes'
import cartRoutes from './routes/cartRoutes'
import categoryRoutes from './routes/categoryRoutes'
import brandRoutes from './routes/brandRoutes'
import orderRoutes from './routes/orderRoutes'
import productRoutes from './routes/productRoutes'
import promotionRoutes from './routes/promotionRoutes'
import userRoutes from './routes/userRoutes'
import profileRoutes from './routes/profileRoutes'
import { ensureCommerceSchema } from './seed/commerceSchema'
import { ensureDefaultAdmin } from './seed/defaultAdmin'

const app: express.Application = express()
const port = Number(process.env.PORT) || 3000

app.disable('x-powered-by')
app.use(bodyParser.json({ limit: '1mb' }))

app.use((req: Request, res: Response, next) => {
  const configuredOrigins = new Set([
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://localhost:7357',
    'http://127.0.0.1:7357',
    ...(process.env.CORS_ORIGINS || '')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean)
  ])
  const requestOrigin = req.headers.origin

  if (requestOrigin && configuredOrigins.has(requestOrigin)) {
    res.header('Access-Control-Allow-Origin', requestOrigin)
    res.header('Vary', 'Origin')
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.header('X-Content-Type-Options', 'nosniff')
  res.header('X-Frame-Options', 'DENY')
  res.header('Referrer-Policy', 'no-referrer')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

// Static uploads must pass through the same CORS and security headers as API
// responses so Flutter web can display customer avatars from the API origin.
app.use('/uploads', express.static('uploads'))

app.get('/', (req: Request, res: Response) => {
  res.send('Storefront API')
})
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use('/admin/analytics', adminAnalyticsRoutes)
app.use('/admin/chatter', activityLogRoutes)
app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/profile', profileRoutes)
app.use('/products', productRoutes)
app.use('/categories', categoryRoutes)
app.use('/brands', brandRoutes)
app.use('/promotions', promotionRoutes)
app.use('/cart', cartRoutes)
app.use('/orders', orderRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/admin/analytics', adminAnalyticsRoutes)
app.use('/api/admin/chatter', activityLogRoutes)
app.use('/api/users', userRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/brands', brandRoutes)
app.use('/api/promotions', promotionRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)

if (require.main === module) {
  ensureCommerceSchema()
    .then(() => ensureDefaultAdmin())
    .then(() => {
      app.listen(port, () => {
        console.log(`starting app on: 0.0.0.0:${port}`)
      })
    })
    .catch(error => {
      console.error('Could not initialize Storefront API', error)
      process.exitCode = 1
    })
}

export default app
