// import dotenv library
import xmlrpc from 'xmlrpc'
import 'dotenv/config'
import { promisify } from 'util'

export default class OdooRepository {
  static apiKey = process.env.ODOO_API_KEY
  static url = process.env.ODOO_URL
  static dbName = 'pait-main-20457078'
  static username = 'team@infraxio.com'

  static async getData() {
    const server = xmlrpc.createClient({ url: OdooRepository.url + '/xmlrpc/2/common' })

    const dbName = OdooRepository.dbName

    server.methodCall('authenticate', [dbName, 'general@s9-consulting.com', OdooRepository.apiKey, {}], function (error, value) {
      if (error) {
        console.error('Error:', error)
      } else {
        console.log('Autenticación exitosa:', value)
      }
    })
  }

  static async getProducts() {
    const common = xmlrpc.createClient({ url: `${this.url}/xmlrpc/2/common` })
    const object = xmlrpc.createClient({ url: `${this.url}/xmlrpc/2/object` })

    const methodCall = promisify(common.methodCall).bind(common)
    const objectCall = promisify(object.methodCall).bind(object)

    try {
      const uid = await methodCall('authenticate', [this.dbName, this.username, this.apiKey, {}])
      if (!uid) throw new Error('Authentication error')

      const products = await objectCall('execute_kw', [
        this.dbName,
        uid,
        this.apiKey,
        'product.product',
        'search_read',
        [['|', ['company_id', '=', 'Medstream Global'], ['company_id', '=', false]]],
        {}
      ])

      return products
    } catch (error) {
      console.log(error, 'error')
      return []
    }
  }

  static async getProductByTemplateId(productTmplId) {
    const common = xmlrpc.createClient({ url: `${this.url}/xmlrpc/2/common` })
    const object = xmlrpc.createClient({ url: `${this.url}/xmlrpc/2/object` })

    const methodCall = promisify(common.methodCall).bind(common)
    const objectCall = promisify(object.methodCall).bind(object)

    try {
      const uid = await methodCall('authenticate', [
        this.dbName,
        this.username,
        this.apiKey,
        {}
      ])
      if (!uid) throw new Error('Authentication error')

      const productData = await objectCall('execute_kw', [
        this.dbName,
        uid,
        this.apiKey,
        'product.product',
        'search_read',
        [[['product_tmpl_id', '=', productTmplId]]],
        { fields: ['id', 'name', 'default_code', 'list_price', 'qty_available'] } // Campos que necesitas
      ])

      if (productData.length === 0) {
        return null
      }

      return productData[0]
    } catch (error) {
      console.error('Error fetching product:', error)
      return null
    }
  }

  static async getAllContacts() {
    const common = xmlrpc.createClient({ url: `${this.url}/xmlrpc/2/common` })
    const object = xmlrpc.createClient({ url: `${this.url}/xmlrpc/2/object` })

    const methodCall = promisify(common.methodCall).bind(common)
    const objectCall = promisify(object.methodCall).bind(object)

    try {
      const uid = await methodCall('authenticate', [this.dbName, this.username, this.apiKey, {}])
      if (!uid) throw new Error('Auth error')

      const contacts = await objectCall('execute_kw', [
        this.dbName,
        uid,
        this.apiKey,
        'res.partner',
        'search_read',
        [['|', ['company_id', '=', 'Medstream Global'], ['company_id', '=', false]]],
        {}
      ])

      return contacts
    } catch (error) {
      return []
    }
  }

  static async getProductPriceForCustomer(productId, customerId) {
    const common = xmlrpc.createClient({ url: `${this.url}/xmlrpc/2/common` })
    const object = xmlrpc.createClient({ url: `${this.url}/xmlrpc/2/object` })

    const methodCall = promisify(common.methodCall).bind(common)
    const objectCall = promisify(object.methodCall).bind(object)

    try {
      const uid = await methodCall('authenticate', [this.dbName, this.username, this.apiKey, {}])
      if (!uid) throw new Error('Authentication error')

      const customerData = await objectCall('execute_kw', [
        this.dbName,
        uid,
        this.apiKey,
        'res.partner',
        'read',
        [[customerId]],
        { fields: ['property_product_pricelist'] }
      ])

      const priceListId = customerData?.[0]?.property_product_pricelist?.[0] || null

      if (!priceListId) {
        console.log(`Cliente ${customerId} no tiene lista de precios. Se usará el precio normal del producto.`)
        return await this.getDefaultProductPrice(productId, uid, objectCall)
      }

      const priceListItem = await objectCall('execute_kw', [
        this.dbName,
        uid,
        this.apiKey,
        'product.pricelist.item',
        'search_read',
        [[['pricelist_id', '=', priceListId], ['product_tmpl_id', '=', productId]]],
        { fields: ['fixed_price'] }
      ])

      if (!priceListItem.length) {
        return await this.getDefaultProductPrice(productId, uid, objectCall)
      }

      return priceListItem[0].fixed_price
    } catch (error) {
      console.error('Error:', error)
      return null
    }
  }

  static async getDefaultProductPrice(productId, uid, objectCall) {
    const productData = await objectCall('execute_kw', [
      this.dbName,
      uid,
      this.apiKey,
      'product.template',
      'read',
      [[productId]],
      { fields: ['list_price'] }
    ])

    return productData?.[0]?.list_price || 0
  }

  static async createOrder(orderData) {
    const common = xmlrpc.createClient({ url: `${this.url}/xmlrpc/2/common` })
    const object = xmlrpc.createClient({ url: `${this.url}/xmlrpc/2/object` })

    const methodCall = promisify(common.methodCall).bind(common)
    const objectCall = promisify(object.methodCall).bind(object)

    try {
      const uid = await methodCall('authenticate', [this.dbName, this.username, this.apiKey, {}])
      if (!uid) throw new Error('Authentication error')

      // Crear la orden de venta
      const orderId = await objectCall('execute_kw', [
        this.dbName,
        uid,
        this.apiKey,
        'sale.order', // Modelo de órdenes de venta en Odoo
        'create',
        [orderData] // Datos de la orden
      ])

      return orderId
    } catch (error) {
      console.log(error, 'error')
      return null
    }
  }

  static async getProductsByPriceList(pricelistId) {
    const common = xmlrpc.createClient({ url: `${this.url}/xmlrpc/2/common` })
    const object = xmlrpc.createClient({ url: `${this.url}/xmlrpc/2/object` })

    const methodCall = promisify(common.methodCall).bind(common)
    const objectCall = promisify(object.methodCall).bind(object)

    try {
      const uid = await methodCall('authenticate', [this.dbName, this.username, this.apiKey, {}])
      if (!uid) throw new Error('Authentication error')

      const products = await objectCall('execute_kw', [
        this.dbName,
        uid,
        this.apiKey,
        'product.pricelist.item',
        'search_read',
        [[['pricelist_id', '=', pricelistId]]],
        {}
      ])

      return products
    } catch (error) {
      console.error('Error fetching products from price list:', error)
      return []
    }
  }
}
