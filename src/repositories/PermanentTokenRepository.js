import prisma from '../utils/prisma.js'
import { createHash } from 'crypto'

export default class PermanentTokenRepository {
  static async getAll ({ page, limit, filters, sortField, sortOrder }) {
    const _page = page ?? 1
    const _limit = limit ?? null
    const skip = _limit !== null ? (_page - 1) * _limit : null
    const _sortOrder = sortOrder === 1 ? 'asc' : 'desc'
    sortField = sortField ?? 'created_at'

    const whereClause = {
      active: true
    }

    if (filters) {
      if (filters.global && filters.global.value) {
        const globalValue = filters.global.value
        whereClause.OR = [
          { token: { contains: globalValue, mode: 'insensitive' } }
        ]
      }

      const filterFields = ['data.token']
      filterFields.forEach(field => {
        if (filters[field] && filters[field].constraints[0].value) {
          whereClause[field.split('.')[1]] = {
            startsWith: filters[field].constraints[0].value,
            mode: 'insensitive'
          }
        }
      })
    }

    const results = await prisma.permanent_tokens.findMany({
      where: whereClause,
      skip,
      take: _limit,
      orderBy: {
        [sortField]: _sortOrder
      }
    })

    const total = await prisma.permanent_tokens.count({
      where: whereClause
    })

    return {
      data: results,
      meta: {
        total
      }
    }
  }

  static async get (id) {
    const result = await prisma.permanent_tokens.findFirst({
      where: {
        id,
        active: true
      }
    })

    return result
  }

  static async getByToken (token) {
    const result = await prisma.permanent_tokens.findFirst({
      where: {
        token,
        active: true
      }
    })

    return result
  }

  static async create (data, createdBy) {
    const { name, domains } = data
    const time = new Date()
    const timeStamp = time.getTime()
    const token = createHash('sha256').update(name + domains + timeStamp).digest('hex')
    const created_by = parseInt(createdBy)

    const result = await prisma.permanent_tokens.create({
      data: {
        name,
        domains,
        token,
        created_by
      }
    })

    return result
  }

  static async update(id, data, updatedBy) {
    const { name, domains, token } = data
    const updated_by = parseInt(updatedBy)
    id = parseInt(id)

    const result = await prisma.permanent_tokens.update({
      where: { id },
      data: {
        name,
        domains,
        token,
        updated_by
      }
    })

    return result
  }

  static async delete (id) {
    id = parseInt(id)

    const result = await prisma.permanent_tokens.delete({
      where: { id }
    })

    return result
  }

  static async archive (id) {
    id = parseInt(id)

    const result = await prisma.permanent_tokens.update({
      where: { id },
      data: { active: false }
    })

    return result
  }
}
