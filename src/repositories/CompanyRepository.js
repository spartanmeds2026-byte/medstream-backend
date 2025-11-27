import prisma from '../utils/prisma.js'

export default class CompanyRepository {
  static async get(id) {
    id = parseInt(id)
    const result = await prisma.companies.findFirst({
      where: {
        id
      }
    })

    return result
  }
}
