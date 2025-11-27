import { Router } from 'express'
import { verifyAuth } from '../middlewares/auth.js'
import { ProductController } from '../controllers/ProductController.js'
import { getPermissions } from '../middlewares/permissions.js'

export const productRouter = ({ productRepository, clientRepository, odooRepository, productService, categoryRepository }) => {
  const router = Router()
  const productController = new ProductController({ productRepository, clientRepository, odooRepository, productService, categoryRepository })

  router.use(verifyAuth)

  router.use(getPermissions('products'))
  router.get('/', productController.index.bind(productController))
  router.get('/featured-on-website', productController.featuredOnWebsite.bind(productController))
  router.get('/ordered', productController.orderedProducts.bind(productController))
  router.get('/price-list', productController.priceList.bind(productController))
  router.get('/with-special-price', productController.paginatedWithSpecialPrice.bind(productController))
  router.get('/:id', productController.show.bind(productController))
  router.get('/:id/special-price', productController.specialPrice.bind(productController))
  router.post('/', productController.store.bind(productController))
  router.put('/:id', productController.update.bind(productController))
  router.delete('/:id', productController.destroy.bind(productController))

  return router
}
