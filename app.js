import express from 'express'
import bodyParser from 'body-parser'

// Routes
import { createUserRouter } from './src/routes/users.js'
import { createAuthRouter } from './src/routes/auth.js'
import { createProfileRouter } from './src/routes/profile.js'
import { createContactRouter } from './src/routes/contact.js'
import { dashboardRouter } from './src/routes/dashboard.js'
import { permissionRouter } from './src/routes/permissions.js'
import { productRouter } from './src/routes/products.js'
import { createClientRouter } from './src/routes/clients.js'
import { createOrderRouter } from './src/routes/orders.js'
// Dependencies
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import container from './src/container.js'
import { createAddressRouter } from './src/routes/address.js'
import { createCategoryRouter } from './src/routes/category.js'

export const createApp = ({
  userRepository,
  storageRepository,
  sendgridRepository,
  twilioRepository,
  roleRepository,
  permissionRepository,
  userRoleRepository,
  moduleRepository,
  productRepository,
  clientRepository,
  odooRepository,
  salesRepRepository,
  paymentTermRepository,
  categoryRepository
}) => {
  const app = express()
  app.use(bodyParser.json({ limit: '200mb', extended: true }))
  app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(cookieParser())

  // CORS
  const allowedOrigins = ['http://localhost:5173', '*.infraxio.app', '*.medstreamglobal.com', '*.spartanmeds.com', '*.spartanmedsupply.com']
  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true) // Allow requests with no origin (like mobile apps or curl requests)

      // Parse the origin to extract the hostname
      const parsedOrigin = new URL(origin).hostname

      // Check if the origin matches any allowed domain or subdomain pattern
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin === origin) {
          return true
        }

        if (allowedOrigin.startsWith('*.')) {
          const allowedDomain = allowedOrigin.slice(2)
          return parsedOrigin.endsWith(allowedDomain)
        }

        return false
      })

      if (isAllowed) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
  app.use(cors(corsOptions))

  app.disable('x-powered-by')
  app.options('/', cors)

  app.use('/', dashboardRouter)

  app.use('/users', createUserRouter({
    userRepository,
    storageRepository,
    userRoleRepository,
    clientRepository,
    sendgridRepository
  }))

  app.use('/auth', createAuthRouter({
    authService: container.authService
  }))

  app.use('/profile', createProfileRouter({
    userRepository,
    storageRepository,
    roleRepository,
    permissionRepository,
    moduleRepository
  }))

  app.use('/contact', createContactRouter({
    sendgridRepository,
    twilioRepository
  }))

  app.use('/permissions', permissionRouter({
    permissionRepository,
    roleRepository,
    userRoleRepository,
    moduleRepository,
    userRepository
  }))

  app.use('/products', productRouter({
    productRepository,
    clientRepository,
    categoryRepository,
    odooRepository,
    productService: container.productService
  }))

  app.use('/clients', createClientRouter({
    clientRepository,
    sendgridRepository,
    salesRepRepository,
    paymentTermRepository
  }))

  app.use('/orders', createOrderRouter({
    orderService: container.orderService
  }))

  app.use('/addresses', createAddressRouter({
    addressService: container.addressService
  }))

  app.use('/categories', createCategoryRouter({
    categoryService: container.categoryService
  }))

  const port = process.env.PORT || 3000

  const server = app.listen(port, () => {
    console.info(`Listening on port http://localhost:${port}`)
  })
  return { app, server }
}
