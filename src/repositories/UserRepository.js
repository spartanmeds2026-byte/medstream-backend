import { randomUUID, createHash } from 'crypto'
import prisma from '../utils/prisma.js'
import UserRoleRepository from './UserRoleRepository.js'

export class UserRepository {
  static async getAll ({ page, limit }) {
    const _page = page ?? 1
    const _limit = limit ?? null
    const skip = _limit !== null ? (_page - 1) * _limit : null

    const users = await prisma.users.findMany({
      skip: skip !== null ? parseInt(skip) : undefined,
      take: _limit !== null ? parseInt(_limit) : undefined,
      where: {
        email: {
          not: null
        }
      }
    })

    const totalRecords = await prisma.users.count()

    return {
      meta: {
        total: totalRecords
      },
      results: users
    }
  }

  static async get(id) {
    id = parseInt(id)

    const userWithClient = await prisma.users.findUnique({
      where: { id },
      include: {
        client_users: {
          include: {
            clients: true
          }
        }
      }
    })

    if (!userWithClient) return null

    const client = userWithClient.client_users[0]?.clients || null

    // Get user's role information
    const userRole = await prisma.user_roles.findFirst({
      where: {
        user_id: id
      },
      include: {
        roles: true
      }
    })

    // Check if user has admin role (id 1)
    const adminRole = await prisma.user_roles.findFirst({
      where: {
        user_id: id,
        role_id: 1
      }
    })

    return {
      id: userWithClient.id,
      first_name: userWithClient.first_name,
      last_name: userWithClient.last_name,
      email: userWithClient.email,
      picture: userWithClient.picture,
      created_at: userWithClient.created_at,
      updated_at: userWithClient.updated_at,
      role: userRole?.roles,
      active: userWithClient.active,
      company_id: userWithClient.company_id,
      sales_rep_object: userWithClient.sales_rep_object,
      payment_terms_object: userWithClient.payment_terms_object,
      client,
      is_admin: !!adminRole
    }
  }

  static async getByEmail (email, select = undefined) {
    const user = await prisma.users.findFirst({
      where: {
        email
      },
      select
    })

    return user
  }

  static async getById (id, select = undefined) {
    id = parseInt(id)
    const user = await prisma.users.findFirst({
      where: {
        id
      },
      select
    })

    return user
  }

  static async verifyPassword (user, password) {
    const userPassword = password + user.email + user.password_token
    const hash = createHash('sha256').update(userPassword).digest('hex')

    const passwordsMatch = user.password === hash

    return passwordsMatch
  }

  static async create (data) {
    const passwordToken = randomUUID()
    const password = data.password + data.email + passwordToken
    const hash = createHash('sha256').update(password).digest('hex')
    
    const role = await prisma.roles.findFirst({
      where: { key: data.role }
    })

    if (!role) {
      throw new Error('Role not found')
    }

    const userData = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password: hash,
      password_token: passwordToken,
      role: data.role
    }

    const createdUser = await prisma.users.create({
      data: userData
    })

    await UserRoleRepository.create({ 
      user_id: createdUser.id, 
      role_id: role.id,
      created_by: data.created_by || null
    })

    return createdUser
  }

  static async update (id, data) {
    id = parseInt(id)
    const updatedUser = await prisma.users.update({
      where: {
        id
      },
      data
    })

    return updatedUser
  }

  static async delete (id) {
    id = parseInt(id)
    const deletedUser = await prisma.users.delete({
      where: {
        id
      }
    })

    return deletedUser
  }

  static async hash (user, password) {
    const userPassword = password + user.email + user.password_token
    const hash = createHash('sha256').update(userPassword).digest('hex')

    return hash
  }

  static async getByClient(client_id) {
    const user = await prisma.users.findFirst({
      where: {
        client_users: {
          some: {
            client_id
          }
        }
      }
    })

    return user
  }
}
