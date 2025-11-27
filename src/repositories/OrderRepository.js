import { applyFilters } from '../utils/filter.js'
import prisma from '../utils/prisma.js'

export default class OrderRepository {
  static async getAll({ page, limit, filters, sortField, sortOrder, clientId }) {
    const _page = page ?? 1
    const _limit = limit ?? null
    const skip = _limit !== null ? (_page - 1) * _limit : null
    const _sortOrder = sortOrder == 1 ? 'asc' : 'desc'
    sortField = sortField ?? 'created_at'

    const whereClause = {
      active: true
    }

    if (clientId) {
      whereClause.client_id = parseInt(clientId)
    }

    if (filters) {
      if (filters.global && filters.global.value) {
        const globalValue = filters.global.value
        whereClause.OR = [
          { order_number: { contains: globalValue, mode: 'insensitive' } },
          { status: { contains: globalValue, mode: 'insensitive' } },
          { total: { contains: globalValue, mode: 'insensitive' } }
        ]
      }

      const filterFields = ['data.order_number', 'data.status', 'data.total']
      filterFields.forEach(field => {
        if (filters[field] && filters[field].constraints[0].value) {
          whereClause[field.split('.')[1]] = {
            startsWith: filters[field].constraints[0].value,
            mode: 'insensitive'
          }
        }
      })
    }

    const _filters = applyFilters([], filters)

    const combinedWhereClause = {
      ...whereClause,
      ..._filters.where
    }

    const results = await prisma.orders.findMany({
      skip: skip !== null ? parseInt(skip) : undefined,
      take: _limit !== null ? parseInt(_limit) : undefined,
      where: {
        ...combinedWhereClause
      },
      orderBy: {
        [sortField]: _sortOrder
      }
    })

    const totalRecords = await prisma.orders.count({
      where: {
        ...combinedWhereClause
      }
    })
    return {
      meta: {
        total: totalRecords
      },
      results
    }
  }

  static async get(id) {
    id = parseInt(id)

    const result = await prisma.orders.findUnique({
      where: {
        id
      }
    })

    return result
  }

  static async create(data, company_id, createdBy) {
    const { customer1, order, total1, total, status, state } = data
    const _createdBy = createdBy ? parseInt(createdBy) : undefined
    company_id = parseInt(company_id)
    const orderTotal = total1 || total

    const result = await prisma.orders.create({
      data: {
        client_id: customer1 ? parseInt(customer1.id) : undefined,
        order_number: order ? order.toString() : undefined,
        total: parseFloat(orderTotal),
        data,
        created_by: _createdBy,
        active: true,
        status: status ?? 'submitted',
        company_id,
        state: state
      }
    })

    return result
  }

  static async update(id, data, updatedBy) {
    const { customer1, order, total1, total, odoo_id, status, state } = data
    const _updatedBy = updatedBy ? parseInt(updatedBy) : undefined
    id = parseInt(id)
    const orderTotal = total1 || total

    const result = await prisma.orders.update({
      where: { id },
      data: {
        client_id: customer1 ? parseInt(customer1.id) : undefined,
        order_number: order ? order.toString() : undefined,
        total: parseFloat(orderTotal),
        data,
        updated_by: _updatedBy,
        active: true,
        odoo_id: customer1.odoo_id ? customer1.odoo_id.toString() : undefined,
        status: status ?? 'submitted',
        state: state
      }
    })

    return result
  }

  static async delete(id) {
    id = parseInt(id)
    const deletedOrder = await prisma.orders.delete({
      where: { id }
    })

    return deletedOrder
  }

  static async archive(id) {
    id = parseInt(id)
    const result = await prisma.orders.update({
      where: { id },
      data: { active: false }
    })

    return result
  }

  static async addClient(id, clientId) {
    id = parseInt(id)
    clientId = parseInt(clientId)

    const result = await prisma.order_clients.create({
      data: {
        order_id: id,
        client_id: clientId
      }
    })

    return result
  }

  static async addLine({ orderId, productId, quantity, price, total }) {
    orderId = parseInt(orderId)
    productId = parseInt(productId)
    quantity = parseInt(quantity)
    price = parseFloat(price)
    total = parseFloat(total)
    const result = await prisma.order_products.create({
      data: {
        product_id: productId,
        order_id: orderId,
        quantity,
        price,
        total
      }
    })

    return result
  }

  static async getLine(lineId) {
    lineId = parseInt(lineId)
    const result = await prisma.order_products.findFirst({
      where: {
        id: lineId
      }
    })

    return result
  }

  static async getLines(orderId) {
    orderId = parseInt(orderId)
    const results = await prisma.order_products.findMany({
      where: {
        order_id: orderId
      }
    })

    return results
  }

  static async getLogByProduct(productId) {
    productId = parseInt(productId)
    const results = await prisma.order_products.findMany({
      where: {
        product_id: productId
      },
      include: {
        orders: true
      }
    })

    return results
  }

  static async getByProductId (productId) {
    productId = parseInt(productId)
    const results = await prisma.orders.findMany({
      where: {
        order_products: {
          some: {
            product_id: productId
          }
        }
      },
      select: {
        id: true,
        order_number: true,
        order_products: true
      }
    })

    return results
  }

  static async getByState(state, { page, limit, clientId } = {}) {
    const _page = page ?? 1
    const _limit = limit ?? null
    const skip = _limit !== null ? (_page - 1) * _limit : null

    const whereClause = {
      active: true,
      state: state
    }

    if (clientId) {
      whereClause.client_id = parseInt(clientId)
    }

    const results = await prisma.orders.findMany({
      skip: skip !== null ? parseInt(skip) : undefined,
      take: _limit !== null ? parseInt(_limit) : undefined,
      where: whereClause,
      orderBy: {
        created_at: 'desc'
      }
    })

    const totalRecords = await prisma.orders.count({
      where: whereClause
    })

    return {
      meta: {
        total: totalRecords
      },
      results
    }
  }
}
