import { Router } from 'express'
import { verifyAuth } from '../middlewares/auth.js'
import { getPermissions } from '../middlewares/permissions.js'
import AddressController from '../controllers/AddressController.js'

export const createAddressRouter = ({ addressService }) => {
  const router = Router()
  router.use(verifyAuth)
  const addressController = new AddressController({ addressService })

  router.use(getPermissions('orders'))
  router.get('/', addressController.index.bind(addressController))
  router.post('/', addressController.store.bind(addressController))

  return router
}
