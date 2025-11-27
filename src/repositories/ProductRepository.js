import { applyFilters } from '../utils/filter.js'
import prisma from '../utils/prisma.js'

export default class ProductRepository {
  static async getAll({ page, limit, filters, sortField, sortOrder }, companyId) {
    const _page = page ?? 1
    const _limit = limit ?? null
    const skip = _limit !== null ? (_page - 1) * _limit : null
    const _sortOrder = sortOrder == 1 ? 'asc' : 'desc'
    sortField = sortField ?? 'created_at'

    const whereClause = {
      active: true,
      type: 'consu'
    }

    if (companyId) {
      companyId = parseInt(companyId)
      if (companyId === 1) {
        whereClause.OR = [
          { company_id: 1 },
          { company_id: null }
        ]
      } else {
        whereClause.OR = [
          { company_id: 2 },
          { company_id: 2 },
          { company_id: null }
        ]
      }
    }

    /* if (category_id) {
      category_id = parseInt(category_id)
      whereClause.category_id = category_id
    } */

    if (filters) {
      if (filters.global && filters.global.value) {
        const globalValue = filters.global.value
        whereClause.OR = [
          { brand: { contains: globalValue, mode: 'insensitive' } },
          { sku: { contains: globalValue, mode: 'insensitive' } },
          { title: { contains: globalValue, mode: 'insensitive' } },
          { description: { contains: globalValue, mode: 'insensitive' } },
          { customer_price: { contains: globalValue, mode: 'insensitive' } },
          { quantity: { contains: globalValue, mode: 'insensitive' } }
        ]
      }

      const filterFields = ['data.brand', 'data.sku', 'data.title', 'data.description', 'data.price']
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

    if (_filters.where?.AND) {
      _filters.where.AND = _filters.where.AND.map(condition => {
        if (condition.category_id && condition.category_id.equals) {
          return {
            category_id: {
              equals: parseInt(condition.category_id.equals)
            }
          }
        }
        return condition
      })
    }

    const combinedWhereClause = {
      ...whereClause,
      ..._filters.where
    }

    const results = await prisma.products.findMany({
      skip: skip !== null ? parseInt(skip) : undefined,
      take: _limit !== null ? parseInt(_limit) : undefined,
      where: {
        ...combinedWhereClause
      },
      orderBy: {
        [sortField]: _sortOrder
      }
    })

    const totalRecords = await prisma.products.count({
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
    const module = await prisma.products.findFirst({
      where: {
        id,
        active: true
      }
    })
    if (!module) {
      return null
    }

    return module
  }

  static async getIn(ids) {
    ids = ids.map((id) => parseInt(id))
    const result = await prisma.products.findMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return result
  }

  static async getBySku(sku) {
    const result = await prisma.products.findFirst({
      where: {
        sku,
        active: true
      }
    })
    if (!result) {
      return null
    }

    return result
  }

  static async create(sku, data) {
    const { brand, primaryImage, secondaryImages, title, description1, category, defaultPrice, customerPrice, quantityAvailable, createdBy } = data

    const _createdBy = createdBy ? parseInt(createdBy) : null

    let image = null
    if (primaryImage?.length > 0) {
      image = primaryImage[0]?.url || null
    } else if (secondaryImages?.length > 0) {
      image = secondaryImages[0]?.url || null
    }

    const quantity = quantityAvailable !== undefined ? parseInt(quantityAvailable, 10) : null

    const product = await prisma.products.create({
      data: {
        sku,
        title,
        description: description1,
        brand: brand || null,
        image,
        category,
        default_price: defaultPrice ? parseFloat(defaultPrice) : null,
        customer_price: customerPrice ? parseFloat(customerPrice) : null,
        quantity,
        data,
        created_by: _createdBy,
        active: true
      }
    })

    return product
  }

  static async update(id, data) {
    const { sku, brand, primaryImage, secondaryImages, title, description1, category, defaultPrice, customerPrice, quantityAvailable, updatedBy } = data
    const _updatedBy = updatedBy ? parseInt(updatedBy) : undefined

    let image = null
    if (primaryImage?.length > 0) {
      image = primaryImage[0].url
    } else if (secondaryImages?.length > 0) {
      image = secondaryImages[0].url
    }

    id = parseInt(id)

    const product = await prisma.products.update({
      where: { id },
      data: {
        sku,
        title,
        description: description1,
        brand: brand ?? null,
        image,
        category,
        default_price: defaultPrice ? parseFloat(defaultPrice) : null,
        customer_price: customerPrice ? parseFloat(customerPrice) : null,
        quantity: quantityAvailable,
        data,
        updated_by: _updatedBy,
        active: true
      }
    })

    return product
  }

  static async delete(id) {
    id = parseInt(id)
    const module = await prisma.products.delete({
      where: { id }
    })

    return module
  }

  static async archive(id) {
    id = parseInt(id)

    return prisma.products.update({
      where: { id },
      data: { active: false }
    })
  }

  static async getProductsWithOrders({ page, limit, filters, sortField, sortOrder }) {
    const _page = page ?? 1
    const _limit = limit ?? null
    const skip = _limit !== null ? (_page - 1) * _limit : null
    const _sortOrder = sortOrder == 1 ? 'asc' : 'desc'
    sortField = sortField ?? 'created_at'

    const whereClause = {
      active: true,
      type: 'consu'
    }

    if (filters) {
      if (filters.global && filters.global.value) {
        const globalValue = filters.global.value
        whereClause.OR = [
          { sku: { contains: globalValue, mode: 'insensitive' } },
          { title: { contains: globalValue, mode: 'insensitive' } },
          { last_order_price: { contains: globalValue, mode: 'insensitive' } },
          { total_orders: { contains: globalValue, mode: 'insensitive' } }
        ]
      }

      const filterFields = ['data.sku', 'data.title', 'data.last_order_price', 'data.total_orders']
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

    const results = await prisma.products.findMany({
      skip: skip !== null ? parseInt(skip) : undefined,
      take: _limit !== null ? parseInt(_limit) : undefined,
      where: {
        ...combinedWhereClause,
        order_products: {
          some: {}
        }
      },
      select: {
        id: true,
        sku: true,
        title: true,
        _count: {
          select: { order_products: true }
        },
        order_products: {
          orderBy: { order_id: 'desc' },
          take: 1
        }
      },
      orderBy: {
        [sortField]: _sortOrder
      }
    })

    const totalRecords = await prisma.products.count({
      where: {
        ...combinedWhereClause,
        order_products: {
          some: {}
        }
      }
    })

    const data = results.map(product => ({
      id: product.id,
      sku: product.sku,
      total_orders: product.order_products[0]?.quantity ?? null,
      last_order_price: product.order_products[0]?.total ?? null,
      title: product.title
    }))

    return {
      meta: {
        total: totalRecords
      },
      results: data
    }
  }

  static async getFeaturedOnWebsite({ page, limit, filters, sortField, sortOrder }, companyId) {
    const _page = page ?? 1
    const _limit = limit ?? null
    const skip = _limit !== null ? (_page - 1) * _limit : null
    const _sortOrder = sortOrder == 1 ? 'asc' : 'desc'
    sortField = sortField ?? 'created_at'

    const whereClause = {
      active: true,
      type: 'consu',
      odoo: {
        path: ['featured_on_website'],
        equals: true
      }
    }

    if (companyId) {
      companyId = parseInt(companyId)
      if (companyId === 1) {
        whereClause.OR = [
          { company_id: 1 },
          { company_id: null }
        ]
      } else {
        whereClause.OR = [
          { company_id: 2 },
          { company_id: 2 },
          { company_id: null }
        ]
      }
    }

    if (filters) {
      if (filters.global && filters.global.value) {
        const globalValue = filters.global.value
        whereClause.OR = [
          { brand: { contains: globalValue, mode: 'insensitive' } },
          { sku: { contains: globalValue, mode: 'insensitive' } },
          { title: { contains: globalValue, mode: 'insensitive' } },
          { description: { contains: globalValue, mode: 'insensitive' } },
          { customer_price: { contains: globalValue, mode: 'insensitive' } },
          { quantity: { contains: globalValue, mode: 'insensitive' } }
        ]
      }

      const filterFields = ['data.brand', 'data.sku', 'data.title', 'data.description', 'data.price']
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

    if (_filters.where?.AND) {
      _filters.where.AND = _filters.where.AND.map(condition => {
        if (condition.category_id && condition.category_id.equals) {
          return {
            category_id: {
              equals: parseInt(condition.category_id.equals)
            }
          }
        }
        return condition
      })
    }

    const combinedWhereClause = {
      ...whereClause,
      ..._filters.where
    }

    const results = await prisma.products.findMany({
      skip: skip !== null ? parseInt(skip) : undefined,
      take: _limit !== null ? parseInt(_limit) : undefined,
      where: {
        ...combinedWhereClause
      },
      orderBy: {
        [sortField]: _sortOrder
      }
    })

    const totalRecords = await prisma.products.count({
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
}
