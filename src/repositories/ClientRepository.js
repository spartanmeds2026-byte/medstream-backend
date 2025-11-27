import { applyFilters } from '../utils/filter.js'
import prisma from '../utils/prisma.js'

export default class ClientRepository {
  static async getAll({ page, limit, filters, sortField, sortOrder }, companyId) {
    const _page = page ?? 1
    const _limit = limit ?? null
    const skip = _limit !== null ? (_page - 1) * _limit : null
    const _sortOrder = sortOrder == 1 ? 'asc' : 'desc'
    sortField = sortField ?? 'created_at'

    companyId = parseInt(companyId)
    const whereClause = {
      company_id: companyId
    }

    if (filters) {
      if (filters.global && filters.global.value) {
        const globalValue = filters.global.value
        whereClause.OR = [
          { name: { contains: globalValue, mode: 'insensitive' } },
          { address: { contains: globalValue, mode: 'insensitive' } }
        ]
      }

      const filterFields = ['data.name', 'data.address']
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

    const results = await prisma.clients.findMany({
      skip: skip !== null ? parseInt(skip) : undefined,
      take: _limit !== null ? parseInt(_limit) : undefined,
      where: {
        ...combinedWhereClause
      },
      orderBy: {
        [sortField]: _sortOrder
      }
    })

    const totalRecords = await prisma.clients.count({
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
    return prisma.clients.findUnique({
      where: {
        id
      }
    })
  }

  static async create(data, createdBy) {
    const { firstName, lastName, city, state, picture, phoneNumber, email } = data

    const picURL = picture.length > 0 ? picture[0].url : undefined
    const name = `${firstName} ${lastName}`
    return prisma.clients.create({
      data: {
        name,
        address: `${city}, ${state}`,
        picture: picURL,
        phone: phoneNumber,
        email,
        data,
        created_by: parseInt(createdBy)
      }
    })
  }

  static async update(id, data, updatedBy) {
    const { firstName, lastName, city, state, picture, phoneNumber, email } = data
    const picURL = picture.length > 0 ? picture[0].url : undefined
    const name = `${firstName} ${lastName}`

    const _updatedBy = updatedBy ? parseInt(updatedBy) : undefined
    id = parseInt(id)
    return prisma.clients.update({
      where: { id },
      data: {
        name,
        address: `${city}, ${state}`,
        picture: picURL,
        phone: phoneNumber,
        email,
        data,
        updated_by: _updatedBy
      }
    })
  }

  static async delete(id) {
    id = parseInt(id)
    return prisma.clients.delete({
      where: { id }
    })
  }

  static async getClientByEmail(billingEmail) {
    return prisma.clients.findFirst({
      where: {
        email: billingEmail
      }
    })
  }

  static async getByUserId(userId) {
    const userClient = await prisma.client_users.findFirst({
      where: {
        user_id: userId
      }
    })

    if (!userClient) return null

    const client = await prisma.clients.findUnique({
      where: {
        id: userClient.client_id
      }
    })

    return client
  }

  static async getClientByUserId(userId) {
    userId = parseInt(userId)
    
    const clientUser = await prisma.client_users.findFirst({
      where: {
        user_id: userId
      },
      include: {
        clients: true
      }
    })

    if (!clientUser) return null

    return clientUser.clients
  }

  static async getUnassignedClients(companyId) {
    companyId = parseInt(companyId)
    
    // Get all client IDs that are assigned to users
    const assignedClientIds = await prisma.client_users.findMany({
      select: {
        client_id: true
      }
    })

    const assignedIds = assignedClientIds.map(item => item.client_id)

    // Get clients that are not in the assigned list
    const unassignedClients = await prisma.clients.findMany({
      where: {
        id: {
          notIn: assignedIds
        },
        company_id: companyId
      },
      orderBy: {
        name: 'asc'
      }
    })

    return unassignedClients
  }

  static async assignClientToUser(userId, clientId, createdBy = null) {
    userId = parseInt(userId)
    clientId = parseInt(clientId)
    
    // Check if association already exists
    const existingAssociation = await prisma.client_users.findFirst({
      where: {
        user_id: userId,
        client_id: clientId
      }
    })

    if (existingAssociation) {
      throw new Error('User is already associated with this client')
    }

    // Create the association
    const clientUser = await prisma.client_users.create({
      data: {
        client_id: clientId,
        user_id: userId
      }
    })

    return clientUser
  }

  static async unassignmentClientFromUser(userId) {
    userId = parseInt(userId)
    
    // Check if association exists
    const existingAssociation = await prisma.client_users.findFirst({
      where: {
        user_id: userId
      }
    })

    if (!existingAssociation) {
      throw new Error('User is not associated with this client')
    }

    // Delete the association
    const deletedAssociation = await prisma.client_users.delete({
      where: {
        id: existingAssociation.id
      }
    })

    return deletedAssociation
  }
}
