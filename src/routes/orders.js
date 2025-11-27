import { Router } from 'express'
import { verifyAuth } from '../middlewares/auth.js'
import OrderController from '../controllers/OrderController.js'
import { getPermissions } from '../middlewares/permissions.js'

export const createOrderRouter = ({ orderService }) => {
  const router = Router()
  router.use(verifyAuth)

  const orderController = new OrderController({ orderService })

  // Order Routes
  router.use(getPermissions('orders'))
  router.get('/', orderController.index.bind(orderController))
  router.get('/draft', orderController.getDraftOrders.bind(orderController))
  router.post('/', orderController.store.bind(orderController))
  router.get('/:id', orderController.show.bind(orderController))
  router.put('/:id', orderController.update.bind(orderController))
  router.delete('/:id', orderController.destroy.bind(orderController))
  router.get('/:id/product', orderController.getHistoryByProduct.bind(orderController))
  router.get('/:id/product/orders', orderController.productOrders.bind(orderController))

  return router
}
