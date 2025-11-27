import { applyFilters } from '../utils/filter.js'
import prisma from '../utils/prisma.js'

export default class ModuleRepository {
  static async getAll({ page, limit, filters, sortField, sortOrder }) {
    const _page = page ?? 1
    const _limit = limit ?? null
    const skip = _limit !== null ? (_page - 1) * _limit : null
    const _sortOrder = sortOrder == 1 ? 'asc' : 'desc'
    sortField = sortField ?? 'created_at'

    const whereClause = {
      active: true
    }

    if (filters) {
      if (filters.global && filters.global.value) {
        const globalValue = filters.global.value
        whereClause.OR = [
          { name: { contains: globalValue, mode: 'insensitive' } }
        ]
      }

      const filterFields = ['data.name']
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

    const results = await prisma.modules.findMany({
      skip: skip !== null ? parseInt(skip) : undefined,
      take: _limit !== null ? parseInt(_limit) : undefined,
      where: {
        ...combinedWhereClause
      },
      orderBy: {
        [sortField]: _sortOrder
      }
    })

    const totalRecords = await prisma.modules.count({
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

  static async get (moduleId) {
    moduleId = parseInt(moduleId)
    const module = await prisma.modules.findFirst({
      where: {
        id: moduleId,
        active: true
      }
    })
    if (!module) {
      return null
    }

    return module
  }

  static async getIn (ids) {
    ids = ids.map((id) => parseInt(id))
    const result = await prisma.modules.findMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return result
  }

  static async getByKey (key) {
    const module = await prisma.modules.findFirst({
      where: {
        key
      }
    })
    return module
  }

  static async create (data) {
    const { name, key, createdBy } = data
    const _createdBy = createdBy ? parseInt(createdBy) : undefined
    const modulesData = {
      name,
      key,
      created_by: _createdBy,
      active: true
    }

    const role = await prisma.modules.create({
      data: modulesData
    })

    return role
  }

  static async update (id, data) {
    id = parseInt(id)
    const { name, key, updatedBy } = data
    const _updatedBy = updatedBy ? parseInt(updatedBy) : undefined

    const module = await prisma.modules.update({
      where: { id },
      data: {
        name,
        key,
        updated_by: _updatedBy
      }
    })

    return module
  }

  static async delete (id) {
    id = parseInt(id)
    const module = await prisma.modules.delete({
      where: { id }
    })
    return module
  }

  static async archive (id) {
    id = parseInt(id)

    return prisma.modules.update({
      where: { id },
      data: { active: false }
    })
  }
}
