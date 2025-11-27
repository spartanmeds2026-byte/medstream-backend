import prisma from '../utils/prisma.js'

export default class SalesRepRepository {
  static async getAll() {
    const result = await prisma.sales_reps.findMany()

    return result
  }

  static async getByOdooId(id) {
    id = parseInt(id)
    const result = await prisma.sales_reps.findFirst({
      where: {
        odoo_id: id
      }
    })

    return result
  }

  static async create(name, id) {
    const result = await prisma.sales_reps.create({
      data: {
        name,
        odoo_id: id
      }
    })

    return result
  }
}
