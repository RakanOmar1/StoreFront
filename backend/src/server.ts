import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from './config/swagger'
import authRoutes from './routes/authRoutes'
import activityLogRoutes from './routes/activityLogRoutes'
import adminAnalyticsRoutes from './routes/adminAnalyticsRoutes'
import cartRoutes from './routes/cartRoutes'
import categoryRoutes from './routes/categoryRoutes'
import orderRoutes from './routes/orderRoutes'
import productRoutes from './routes/productRoutes'
import promotionRoutes from './routes/promotionRoutes'
import userRoutes from './routes/userRoutes'
import { ensureCommerceSchema } from './seed/commerceSchema'
import { ensureDefaultAdmin } from './seed/defaultAdmin'

const app: express.Application = express()
const port = Number(process.env.PORT) || 3000

app.use(bodyParser.json())

app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

app.get('/', (req: Request, res: Response) => {
  res.send('Storefront API')
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use('/admin/analytics', adminAnalyticsRoutes)
app.use('/admin/chatter', activityLogRoutes)
app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/products', productRoutes)
app.use('/categories', categoryRoutes)
app.use('/promotions', promotionRoutes)
app.use('/cart', cartRoutes)
app.use('/orders', orderRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/admin/analytics', adminAnalyticsRoutes)
app.use('/api/admin/chatter', activityLogRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/promotions', promotionRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)

if (require.main === module) {
  ensureCommerceSchema()
    .then(() => ensureDefaultAdmin())
    .catch(error => {
      console.error('Could not ensure startup data', error)
    })
    .finally(() => {
      app.listen(port, () => {
        console.log(`starting app on: 0.0.0.0:${port}`)
      })
    })
}

export default app
