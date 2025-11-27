import { applyFilters } from '../utils/filter.js'
import prisma from '../utils/prisma.js'

export default class RoleRepository {
  static async getAll({ page, limit, filters, sortField, sortOrder }) {
    const _page = page ?? 1
    const _limit = limit ?? null
    const skip = _limit !== null ? (_page - 1) * _limit : null
    const _sortOrder = sortOrder == 1 ? 'asc' : 'desc'
    sortField = sortField ?? 'created_at'

    const whereClause = {
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

    const results = await prisma.roles.findMany({
      skip: skip !== null ? parseInt(skip) : undefined,
      take: _limit !== null ? parseInt(_limit) : undefined,
      where: {
        ...combinedWhereClause
      },
      orderBy: {
        [sortField]: _sortOrder
      }
    })

    const totalRecords = await prisma.roles.count({
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

  static async get (id) {
    id = parseInt(id)
    const role = await prisma.roles.findFirst({
      where: {
        id
      }
    })

    return role
  }

  static async getIn (ids) {
    ids = ids.map((id) => parseInt(id))
    const result = await prisma.roles.findMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return result
  }

  static async getByKey (key) {
    const result = await prisma.roles.findFirst({
      where: { key }
    })

    return result
  }

  static async create (data, createdBy) {
    const { name, key } = data
    const roleData = {
      name,
      key,
      created_by: parseInt(createdBy)
    }

    const role = await prisma.roles.create({
      data: roleData
    })

    return role
  }

  static async update (id, data) {
    const { name, key, updatedBy } = data
    const _updatedBy = updatedBy ? parseInt(updatedBy) : undefined

    id = parseInt(id)
    const role = await prisma.roles.update({
      where: { id },
      data: {
        name,
        key,
        updated_by: _updatedBy
      }
    })

    return role
  }

  static async delete (id) {
    id = parseInt(id)
    const role = await prisma.roles.delete({
      where: { id }
    })

    return role
  }

  static async assignUserRole (roleId, userId, createdBy) {
    roleId = parseInt(roleId)
    userId = parseInt(userId)
    const _createdBy = createdBy ? parseInt(createdBy) : undefined

    const role = await prisma.user_roles.create({
      data: {
        role_id: roleId,
        user_id: userId,
        created_by: _createdBy
      }
    })

    return role
  }

  static async checkUser (roleId, userId) {
    roleId = parseInt(roleId)
    userId = parseInt(userId)

    const role = await prisma.user_roles.findFirst({
      where: {
        role_id: roleId,
        user_id: userId
      }
    }
    )

    return role
  }

  static async removeUserRole(id) {
    id = parseInt(id)

    const result = await prisma.user_roles.delete({
      where: { id }
    })

    return result
  }

  static async getUserRoles (userId) {
    userId = parseInt(userId)

    const roles = await prisma.user_roles.findMany({
      where: {
        user_id: userId
      },
      include: {
        roles: true
      }
    })

    return roles
  }

  static async assignRole (userId, roleId) {
    userId = parseInt(userId)
    roleId = parseInt(roleId)

    const role = await prisma.user_roles.create({
      data: {
        user_id: userId,
        role_id: roleId
      }
    })

    return role
  }

  static async getRolesByIds (roleIds) {
    const parsedRoleIds = roleIds.map(id => parseInt(id))

    const roles = await prisma.roles.findMany({
      where: {
        id: {
          in: parsedRoleIds
        }
      }
    })

    return roles
  }

  static async getUserRoleById(id) {
    id = parseInt(id)
    const userRole = await prisma.user_roles.findUnique({
      where: { id }
    })

    return userRole
  }
}
