import prisma from '../utils/prisma.js'

export default class AddressRepository {
  static async getAll(clientId) {
    clientId = parseInt(clientId)
    const result = await prisma.addresses.findMany({
      where: {
        client_id: clientId
      }
    })

    return result
  }

  static async get(id) {
    id = parseInt(id)
    const result = await prisma.addresses.findFirst({
      where: {
        id
      }
    })

    return result
  }

  static async create(clientId, data) {
    clientId = parseInt(clientId)
    const result = await prisma.addresses.create({
      data: {
        client_id: clientId,
        ...data
      }
    })

    return result
  }
}
