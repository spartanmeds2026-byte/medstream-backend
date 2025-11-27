import { getLoggerForRoute } from '../utils/logger.js'
import { response } from '../utils/response.js'
import getRelations from '../utils/relations.js'
import { validationProduct } from '../validations/products/create.js'
import { validationUpdateProduct } from '../validations/products/update.js'

export class ProductController {
  constructor({ productRepository, clientRepository, odooRepository, productService, categoryRepository }) {
    this.productRepository = productRepository
    this.odooRepository = odooRepository
    this.clientRepository = clientRepository
    this.productService = productService
    this.categoryRepository = categoryRepository
    this.logger = getLoggerForRoute('products')
  }

  index = async (req, res) => {
    if (!req.permissions.list) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { page, limit, filters, sortField, sortOrder, relations } = req.query

      let _sortOrder = -1
      if (sortOrder) _sortOrder = parseInt(sortOrder)

      let category
      if (filters?.category_id && filters.category_id.constraints[0].value) {
        category = await this.categoryRepository.get(filters.category_id.constraints[0].value)
        filters.category_id.constraints[0].value = (category ? category.odoo_id : undefined)
      }

      if (filters?.customer_price && filters.customer_price.constraints[0].value) {
        filters.customer_price.constraints[0].value = parseInt(filters.customer_price.constraints[0].value)
      }

      if (filters?.quantity && filters.quantity.constraints[0].value) {
        filters.quantity.constraints[0].value = parseInt(filters.quantity.constraints[0].value)
      }

      const results = await this.productService.getAll({ page, limit, filters, sortField, sortOrder: _sortOrder }, req.company)

      if (relations) {
        for (let i = 0; i < relations.length; i++) {
          const relation = relations[i]

          results.results = await getRelations(results.results, relation, 'product')
        }
      }

      return res.status(200).json(response(200, results))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  show = async (req, res) => {
    if (!req.permissions.read) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { id } = req.params

      const result = await this.productRepository.get(id)
      if (!result) return res.status(404).json(response(404, 'Product not found'))

      const client = await this.clientRepository.getByUserId(req.auth_user.id)
      if (client) {
        if (client.odoo_id) {
          const odooPrice = await this.odooRepository.getProductPriceForCustomer(parseInt(result.odoo_id), parseInt(client.odoo_id))
          result.data.customerPrice = odooPrice
        }
      }

      return res.status(200).json(response(200, result))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  store = async (req, res) => {
    if (!req.permissions.create) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const productSchema = await validationProduct(req.body)
      if (!productSchema.success) {
        return res.status(400).json(response(400, productSchema.errors))
      }
      const { data } = req.body
      if (!data) {
        return res.status(400).json(response(400, [{ message: 'Data is missing', field: 'data' }]))
      }

      const { sku } = data
      data.createdBy = req.auth_user.id

      const product = await this.productRepository.create(sku, data)

      return res.status(200).json(response(200, product))
    } catch (error) {
      this.logger.error(error.message + error.stack.split('\n')[1])
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  update = async (req, res) => {
    if (!req.permissions.update) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const productSchema = await validationUpdateProduct(req.body)
      if (!productSchema.success) {
        return res.status(400).json(response(400, productSchema.errors))
      }

      const { id } = req.params
      const { data } = req.body

      if (!data) {
        return res.status(400).json(response(400, [{ message: 'Data is missing', field: 'data' }]))
      }

      const product = await this.productRepository.get(id)
      if (!product) return res.status(404).json(response(404, 'Product not found'))

      data.updatedBy = req.auth_user.id

      const productUpdated = await this.productRepository.update(id, data)

      return res.status(200).json(response(200, productUpdated))
    } catch (error) {
      this.logger.error(error.message + error.stack.split('\n')[1])
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  destroy = async (req, res) => {
    if (!req.permissions.del) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { id } = req.params

      const existingRecord = await this.productRepository.get(id)
      if (!existingRecord) return res.status(404).json(response(404, 'Product not found'))

      const result = await this.productRepository.archive(id)

      return res.status(200).json(response(200, result))
    } catch (error) {
      this.logger.error(error.message + error.stack)

      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  specialPrice = async (req, res) => {
    if (!req.permissions.read) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { id } = req.params

      const product = await this.productRepository.get(id)
      if (!product) return res.status(404).json(response(404, 'Product not found'))

      const client = await this.clientRepository.getByUserId(req.auth_user.id)
      if (!client || !client.odoo_id) {
        return res.status(400).json(response(400, 'Client not found or does not have an Odoo ID'))
      }

      const productTmplId = product.odoo?.product_tmpl_id?.[0]
      if (!productTmplId) {
        return res.status(400).json(response(400, 'Product template ID not found in Odoo data'))
      }

      const specialPrice = await this.odooRepository.getProductPriceForCustomer(productTmplId, parseInt(client.odoo_id))

      return res.status(200).json(response(200, { specialPrice }))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  paginatedWithSpecialPrice = async (req, res) => {
    if (!req.permissions.list) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { page, limit, filters, sortField, sortOrder, relations } = req.query

      let _sortOrder = -1
      if (sortOrder) _sortOrder = parseInt(sortOrder)

      const results = await this.productRepository.getAll(
        { page, limit, filters, sortField, sortOrder: _sortOrder },
        req.auth_user.company.id ?? undefined
      )

      const client = await this.clientRepository.getByUserId(req.auth_user.id)

      if (client && client.odoo_id) {
        const productsWithOdooId = results.results.filter(product => {
          const hasOdooId = !!product.odoo_id
          if (!hasOdooId) {
            this.logger.warn(`Product ${product.id} has no odoo_id`)
          }
          return hasOdooId
        })

        const specialPrices = await Promise.all(
          productsWithOdooId.map(product => {
            return this.odooRepository.getProductPriceForCustomer(
              parseInt(product.odoo_id),
              parseInt(client.odoo_id)
            ).catch(error => {
              this.logger.error(`Error getting price for product ${product.id}: ${error.message}`)
              return null
            })
          })
        )

        const priceMap = new Map()
        productsWithOdooId.forEach((product, index) => {
          if (specialPrices[index] !== null) {
            this.logger.info(`Special price for product ${product.id}: ${specialPrices[index]}`)
            priceMap.set(product.id, specialPrices[index])
          } else {
            this.logger.warn(`No special price found for product ${product.id}`)
          }
        })

        results.results = results.results.map(product => {
          if (priceMap.has(product.id)) {
            return {
              ...product,
              data: {
                ...product.data,
                customerPrice: priceMap.get(product.id)
              }
            }
          }
          return product
        })
      } else {
        this.logger.warn('Client has no odoo_id or client not found')
      }

      if (relations) {
        for (let i = 0; i < relations.length; i++) {
          const relation = relations[i]
          results.results = await getRelations(results.results, relation, 'product')
        }
      }

      return res.status(200).json(response(200, results))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  priceList = async (req, res) => {
    if (!req.permissions.read) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const userId = req.auth_user.id

      const result = await this.productService.getPriceList(userId)

      return res.status(result.code).json(result)
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  orderedProducts = async (req, res) => {
    if (!req.permissions.list) return res.status(403).json(response(403, 'Forbidden'))
    try {

      const { page, limit, filters, sortField, sortOrder, relations } = req.query

      let _sortOrder = -1
      if (sortOrder) _sortOrder = parseInt(sortOrder)

      let category
      if (filters?.category_id && filters.category_id.constraints[0].value) {
        category = await this.categoryRepository.get(filters.category_id.constraints[0].value)
        filters.category_id.constraints[0].value = (category ? category.odoo_id : undefined)
      }

      if (filters?.customer_price && filters.customer_price.constraints[0].value) {
        filters.customer_price.constraints[0].value = parseInt(filters.customer_price.constraints[0].value)
      }

      if (filters?.quantity && filters.quantity.constraints[0].value) {
        filters.quantity.constraints[0].value = parseInt(filters.quantity.constraints[0].value)
      }

      const result = await this.productService.orderedProducts({ page, limit, filters, sortField, sortOrder: _sortOrder })

      return res.status(result.code).json(result)
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  featuredOnWebsite = async (req, res) => {
    if (!req.permissions.list) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { page, limit, filters, sortField, sortOrder, relations } = req.query

      let _sortOrder = -1
      if (sortOrder) _sortOrder = parseInt(sortOrder)

      let category
      if (filters?.category_id && filters.category_id.constraints[0].value) {
        category = await this.categoryRepository.get(filters.category_id.constraints[0].value)
        filters.category_id.constraints[0].value = (category ? category.odoo_id : undefined)
      }

      if (filters?.customer_price && filters.customer_price.constraints[0].value) {
        filters.customer_price.constraints[0].value = parseInt(filters.customer_price.constraints[0].value)
      }

      if (filters?.quantity && filters.quantity.constraints[0].value) {
        filters.quantity.constraints[0].value = parseInt(filters.quantity.constraints[0].value)
      }

      const results = await this.productService.getFeaturedOnWebsite({ page, limit, filters, sortField, sortOrder: _sortOrder }, req.company)

      if (relations) {
        for (let i = 0; i < relations.length; i++) {
          const relation = relations[i]
          results.results = await getRelations(results.results, relation, 'product')
        }
      }

      return res.status(200).json(response(200, results))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }
}
