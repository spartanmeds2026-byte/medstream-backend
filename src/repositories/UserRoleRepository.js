import prisma from '../utils/prisma.js'

export default class UserRoleRepository {
  static async get (id) {
    id = parseInt(id)
    const userRole = await prisma.user_roles.findUnique({
      where: { id }
    })

    return userRole
  }

  static async create (data) {
    const userRole = await prisma.user_roles.create({
      data
    })

    return userRole
  }

  static async update (id, data) {
    id = parseInt(id)
    const userRole = await prisma.user_roles.update({
      where: { id },
      data
    })

    return userRole
  }

  static async delete (id) {
    id = parseInt(id)
    const userRole = await prisma.user_roles.delete({
      where: { id }
    })

    return userRole
  }

  static async getDefaultUserRole (userId) {
    userId = parseInt(userId)
    const defaultUserRole = await prisma.user_roles.findFirst({
      where: {
        user_id: userId,
        default: true
      }
    })
    if (!defaultUserRole) return null

    return defaultUserRole
  }

  static async updatePermission (id, data) {
    id = parseInt(id)
    const updatedPermission = await prisma.user_roles.update({
      where: { id },
      data
    })

    return updatedPermission
  }

  static async createPermission (data) {
    const newPermission = await prisma.user_roles.create({
      data
    })

    return newPermission
  }

  static async getPermissionsByUserId (userId) {
    userId = parseInt(userId)

    const userRoles = await prisma.user_roles.findMany({
      where: {
        user_id: userId
      },
      include: {
        roles: {
          include: {
            permission_roles: true
          }
        }
      }
    })

    return userRoles
  }
}
