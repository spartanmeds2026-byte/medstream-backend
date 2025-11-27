import { applyFilters } from '../utils/filter.js'
import prisma from '../utils/prisma.js'

export default class PermissionRepository {
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

    const results = await prisma.permissions.findMany({
      skip: skip !== null ? parseInt(skip) : undefined,
      take: _limit !== null ? parseInt(_limit) : undefined,
      where: {
        ...combinedWhereClause
      },
      orderBy: {
        [sortField]: _sortOrder
      }
    })

    const totalRecords = await prisma.permissions.count({
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
    const result = await prisma.permissions.findUnique({
      where: {
        id
      }
    })

    return result
  }

  static async getByKey(key) {
    const permission = await prisma.permissions.findFirst({
      where: { key }
    })

    return permission
  }

  static async create(data) {
    const { name, key, createdBy } = data
    const _createdBy = createdBy ? parseInt(createdBy) : undefined
    const result = await prisma.permissions.create({
      data: {
        name,
        key,
        created_by: _createdBy
      }
    })

    return result
  }

  static async update(id, data) {
    id = parseInt(id)
    const { name, key, updatedBy } = data
    const _updatedBy = updatedBy ? parseInt(updatedBy) : undefined
    const result = await prisma.permissions.update({
      where: { id },
      data: {
        name,
        key,
        updated_by: _updatedBy
      }
    })

    return result
  }

  static async archive(id) {
    id = parseInt(id)

    return prisma.permissions.update({
      where: { id },
      data: { active: false }
    })
  }

  static async delete(id) {
    id = parseInt(id)

    const result = await prisma.permissions.delete({
      where: { id }
    })

    return result
  }

  static async register(role_id, permission_id, module_id) {
    role_id = parseInt(role_id)
    permission_id = parseInt(permission_id)
    module_id = parseInt(module_id)

    const result = await prisma.permission_roles.create({
      data: {
        role_id,
        permission_id,
        module_id
      }
    })

    return result
  }

  static async check(role_id, permission_id, module_id) {
    role_id = parseInt(role_id)
    permission_id = parseInt(permission_id)
    module_id = parseInt(module_id)

    const result = await prisma.permission_roles.findFirst({
      where: {
        role_id,
        permission_id,
        module_id
      }
    })

    return result
  }

  static async revoke(role_id, permission_id, module_id) {
    role_id = parseInt(role_id)
    permission_id = parseInt(permission_id)
    module_id = parseInt(module_id)

    const result = await prisma.permission_roles.deleteMany({
      where: {
        role_id,
        permission_id,
        module_id
      }
    })

    return result
  }

  static async getPermissionRoles({ permission_id, role_id, module_id }) {
    if (permission_id) {
      permission_id = parseInt(permission_id)
    }

    if (role_id) {
      role_id = parseInt(role_id)
    }

    if (module_id) {
      module_id = parseInt(module_id)
    }

    const result = await prisma.permission_roles.findMany({
      where: {
        permission_id,
        role_id,
        module_id
      },
      include: {
        modules: true,
        roles: true,
        permissions: true
      }
    })

    return result
  }
}
