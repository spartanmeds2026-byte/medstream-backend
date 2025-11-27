import { response } from '../utils/response.js'

export default class ProductService {
  constructor({ odooRepository, clientRepository, productRepository }) {
    this.odooRepository = odooRepository
    this.clientRepository = clientRepository
    this.productRepository = productRepository
  }

  getPriceList = async (userId) => {
    const client = await this.clientRepository.getByUserId(userId)
    if (!client) return response(404, 'Client not found')

    if (!client.odoo?.property_product_pricelist) return response(404, 'Pricelist not found')

    const pricelist = await this.odooRepository.getProductsByPriceList(client.odoo.property_product_pricelist[0])

    return response(200, pricelist)
  }

  orderedProducts = async (req) => {
    const { page, limit, filters, sortField, sortOrder, relations } = req

    let _sortOrder = -1
    if (sortOrder) _sortOrder = parseInt(sortOrder)

    const products = await this.productRepository.getProductsWithOrders({ page, limit, filters, sortField, sortOrder: _sortOrder})

    return response(200, products)
  }

  getFeaturedOnWebsite = async ({ page, limit, filters, sortField, sortOrder }, companyId) => {
    return await this.productRepository.getFeaturedOnWebsite({ page, limit, filters, sortField, sortOrder }, companyId)
  }

  getAll = async ({ page, limit, filters, sortField, sortOrder }, companyId) => {
    return await this.productRepository.getAll({ page, limit, filters, sortField, sortOrder }, companyId)
  }
}
