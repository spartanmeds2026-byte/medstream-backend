import { applyFilters } from '../utils/filter.js'
import prisma from '../utils/prisma.js'

export default class CategoryRepository {
  static async getAll({ page, limit, filters, sortField, sortOrder }, companyId) {
    const _page = page ?? 1
    const _limit = limit ?? null
    const skip = _limit !== null ? (_page - 1) * _limit : null
    const _sortOrder = sortOrder == 1 ? 'asc' : 'desc'
    sortField = sortField ?? 'created_at'

    const whereClause = {}

    // Filtrar categorías que no estén deshabilitadas en el portal
    whereClause.odoo = {
      path: ['x_studio_disable_on_portal'],
      not: true
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
          { name: { contains: globalValue, mode: 'insensitive' } },
          { odoo_id: { contains: globalValue, mode: 'insensitive' } }
        ]
      }

      const filterFields = ['name', 'odoo_id']
      filterFields.forEach(field => {
        if (filters[field] && filters[field].constraints[0].value) {
          whereClause[field] = {
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

    const results = await prisma.categories.findMany({
      skip: skip !== null ? parseInt(skip) : undefined,
      take: _limit !== null ? parseInt(_limit) : undefined,
      where: {
        ...combinedWhereClause
      },
      orderBy: {
        [sortField]: _sortOrder
      }
    })

    const totalRecords = await prisma.categories.count({
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

  static async getAllSimple() {
    const result = await prisma.categories.findMany()

    return result
  }

  static async get (id) {
    id = parseInt(id)
    const result = prisma.categories.findFirst({
      where: {
        id
      }
    })

    return result
  }

  static async create(data) {
    const { name, image, company_id, odoo } = data
    const result = await prisma.categories.create({
      data: {
        name,
        image,
        company_id,
        odoo,
        odoo_id: odoo.id
      }
    })

    return result
  }

  static async update(id, data) {
    id = parseInt(id)
    const { name, image, company_id, odoo } = data
    const result = await prisma.categories.update({
      where: { id },
      data: {
        name,
        image,
        company_id,
        odoo,
        odoo_id: odoo.id
      }
    })

    return result
  }
}
