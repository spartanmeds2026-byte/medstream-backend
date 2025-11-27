import getRelations from '../utils/relations.js'
import { response } from '../utils/response.js'
import moment from 'moment'

export default class OrderService {
  constructor({ orderRepository, clientRepository, productRepository, odooRepository, sendgridRepository }) {
    this.orderRepository = orderRepository
    this.clientRepository = clientRepository
    this.productRepository = productRepository
    this.odooRepository = odooRepository
    this.sendgridRepository = new sendgridRepository()
  }

  index = async (req) => {
    const { page, limit, filters, sortField, sortOrder, relations } = req.query

    let _sortOrder = -1
    if (sortOrder) _sortOrder = parseInt(sortOrder)

    let filterByClientId
    console.log(req.permissions)
    if (req.permissions.own) {
      const client = await this.clientRepository.getByUserId(req.auth_user.id)
      filterByClientId = client.id
    }
    const results = await this.orderRepository.getAll({ page, limit, filters, sortField, sortOrder: _sortOrder, clientId: filterByClientId })

    if (relations) {
      for (let i = 0; i < relations.length; i++) {
        const relation = relations[i]

        results.results = await getRelations(results.results, relation)
      }
    }

    return response(200, results)
  }

  show = async (req) => {
    const { id } = req.params
    const result = await this.orderRepository.get(id)
    if (!result) return response(404, 'Order not found')

    return response(200, result)
  }

  store = async (req) => {
    const { data, status, state } = req.body
    if (!data) return response(400, 'Invalid request')

    const requiredFields = ['customer1', 'total1']
    const missingFields = requiredFields.filter(field => data[field] === undefined)

    if (missingFields.length > 0) {
      return response(400, `Missing required fields: ${missingFields.join(', ')}`)
    }
    data.status = status ?? 'submitted'
    data.state = state

    const result = await this.orderRepository.create(data, req.auth_user.company.id, req.auth_user.id)

    result.data.order = result.id + 10000

    await this.orderRepository.update(result.id, result.data, req.auth_user.id)

    for (const line of data.dataGrid) {
      await this.orderRepository.addLine({ orderId: result.id, productId: line.product.id, quantity: line.quantity, price: line.price, total: line.price })
    }

    if (state !== 'draft') {
      /* await this.sendgridRepository.sendEmail({
        to: req.auth_user.email,
        cc: 'orders@medstreamglobal.com',
        bcc: 'accounting@medstreamglobal.com',
        from: 'orders@medstreamglobal.com',
        subject: 'Order Created',
        text: 'nothing',
        template: 'd-90a151ecfad145c08e34ac3e978b469e',
        body: {
          order_number: result.data.order_number,
          order_url: `https://portal.medstreamglobal.com/orders/${result.id}`
        }
      }) */

      const odooOrder = await this.syncToOdoo(result.id, req.auth_user.company.odoo_id)

      data.odoo_id = odooOrder
    }

    await this.orderRepository.update(result.id, data, req.auth_user.id)

    await this.orderRepository.addClient(result.id, data.customer1.id)

    return response(201, result)
  }

  update = async (req) => {
    const { data, status, state } = req.body
    const { id } = req.params

    if (!data) {
      return response(400, 'Request body is missing')
    }

    const existingOrder = await this.orderRepository.get(id)
    if (!existingOrder) {
      return response(404, 'Order not found')
    }

    const client = data.client
      ? await this.clientRepository.get(data.client.id)
      : null

    if (data.client && !client) {
      return response(404, 'Client not found')
    }

    data.client = client
    data.status = status
    data.state = state

    const updatedOrder = await this.orderRepository.update(id, data, req.auth_user.id)

    if (state === 'submitted') {
      await this.sendgridRepository.sendEmail({
        to: req.auth_user.email,
        cc: 'orders@medstreamglobal.com',
        bcc: 'accounting@medstreamglobal.com',
        from: 'orders@medstreamglobal.com',
        subject: 'Order Created',
        text: 'nothing',
        template: 'd-90a151ecfad145c08e34ac3e978b469e',
        body: {
          order_number: data.salesOrderNumber,
          order_url: `https://portal.medstreamglobal.com/orders/${updatedOrder.id}`
        }
      })

      const odooOrder = await this.syncToOdoo(updatedOrder.id, req.auth_user.company.odoo_id)

      data.odoo_id = odooOrder
    }

    return response(200, updatedOrder)
  }

  destroy = async (req) => {
    const { id } = req.params
    const dataExist = await this.orderRepository.get(id)
    if (!dataExist) return response(404, 'Order not found')

    await this.orderRepository.archive(id)

    return response(200, 'Order deleted successfully')
  }

  syncToOdoo = async (orderId, companyId) => {
    const order = await this.orderRepository.get(orderId)
    const lines = order.data.dataGrid
    const specialPrices = order.data.priceListProducts || order.data.dataGrid
    for (const sp of specialPrices) {
      if (sp.quantity < 1) {
        continue
      }

      const odooProduct = await this.odooRepository.getProductByTemplateId(sp.product.product_tmpl_id[0])

      sp.product.odoo_id = odooProduct.id
      sp.product.odoo = {}
      sp.product.odoo.id = odooProduct.id
      sp.product.title = sp.product.display_name

      // lines.push({
      //   product: sp.product,
      //   quantity: sp.quantity,
      //   price: sp.price
      // })
    }
    
    const odooOrderData = {
      name: `ORDER-${order.order_number}`,
      date_order: moment(order.created_at).format('YYYY-MM-DD HH:mm:ss'),
      company_id: companyId,
      order_line: lines.map(line => ([0, 0, {
        product_id: parseInt(line.product.odoo.id),
        name: line.product.title,
        product_uom_qty: line.quantity,
        price_unit: line.price,
        tax_id: [],
        price_subtotal: line.quantity * line.price,
        price_total: (line.quantity * line.price),
        discount: 0
      }])),
      amount_total: order.total + order.data.tax,
      amount_tax: order.data.tax ? parseFloat(order.data.tax) : 0,
      amount_untaxed: order.total,
      partner_id: parseInt(order.data.customer1.odoo_id)
    }

    console.log('odooOrderData', odooOrderData)

    const odooOrder = await this.odooRepository.createOrder(odooOrderData)

    return odooOrder
  }

  getOrdersByProduct = async (productId) => {
    const orders = await this.orderRepository.getLogByProduct(productId)

    return response(200, orders)
  }

  getProductOrders = async (productId) => {
    const orders = await this.orderRepository.getByProductId(productId)

    return response(200, orders)
  }

  getDraftOrders = async (req) => {
    const { page, limit, relations } = req.query

    let filterByClientId
    if (req.permissions.own) {
      const client = await this.clientRepository.getByUserId(req.auth_user.id)
      filterByClientId = client.id
    }

    const results = await this.orderRepository.getByState('draft', { 
      page, 
      limit, 
      clientId: filterByClientId 
    })

    if (relations) {
      for (let i = 0; i < relations.length; i++) {
        const relation = relations[i]
        results.results = await getRelations(results.results, relation)
      }
    }

    return response(200, results)
  }

  draftStore = async (req) => {
    const { data, status } = req.body
    if (!data) return response(400, 'Invalid request')

    const requiredFields = ['customer1', 'total1']
    const missingFields = requiredFields.filter(field => data[field] === undefined)

    if (missingFields.length > 0) {
      return response(400, `Missing required fields: ${missingFields.join(', ')}`)
    }
    data.status = status ?? 'draft'

    const result = await this.orderRepository.create(data, req.auth_user.company.id, req.auth_user.id)

    result.data.order = result.id + 10000

    await this.orderRepository.update(result.id, result.data, req.auth_user.id)

    for (const line of data.dataGrid) {
      await this.orderRepository.addLine({ orderId: result.id, productId: line.product.id, quantity: line.quantity, price: line.price, total: line.price })
    }

    if (status !== 'draft') {
      await this.sendgridRepository.sendEmail({
        to: req.auth_user.email,
        cc: 'orders@medstreamglobal.com',
        bcc: 'accounting@medstreamglobal.com',
        from: 'orders@medstreamglobal.com',
        subject: 'Order Created',
        text: 'nothing',
        template: 'd-90a151ecfad145c08e34ac3e978b469e',
        body: {
          order_number: result.data.order_number,
          order_url: `https://portal.medstreamglobal.com/orders/${result.id}`
        }
      })

      const odooOrder = await this.syncToOdoo(result.id, req.auth_user.company.odoo_id)

      data.odoo_id = odooOrder
    }

    await this.orderRepository.update(result.id, data, req.auth_user.id)

    await this.orderRepository.addClient(result.id, data.customer1.id)

    return response(201, result)
  }
}
