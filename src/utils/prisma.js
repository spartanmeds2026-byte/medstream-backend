import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  omit: {
    users: {
      password: true,
      password_token: true
    }
  }
})

export default prisma
