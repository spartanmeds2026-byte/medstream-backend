import { Router } from 'express'
import { verifyAuth } from '../middlewares/auth.js'
import { getPermissions } from '../middlewares/permissions.js'
import CategoryController from '../controllers/CategoryController.js'

export const createCategoryRouter = ({ categoryService }) => {
  const router = Router()
  const categoryController = new CategoryController({ categoryService })

  router.use(verifyAuth)

  router.use(getPermissions('categories'))
  router.get('/', categoryController.index.bind(categoryController))

  return router
}
