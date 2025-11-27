import prisma from '../utils/prisma.js'

export default class PaymentTermRepository {
  static async getAll() {
    const result = await prisma.payment_terms.findMany()

    return result
  }

  static async getByOdooId(id) {
    id = parseInt(id)
    const result = await prisma.payment_terms.findFirst({
      where: {
        id
      }
    })

    return result
  }

  static async create(name, id) {
    const result = await prisma.payment_terms.create({
      data: {
        name,
        odoo_id: id
      }
    })

    return result
  }
}
