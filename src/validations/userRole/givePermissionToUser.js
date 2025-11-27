import { z } from 'zod'

const givePermissionsSchema = z.object({
  roleId: z.number(),
  default: z.boolean()
})

const parseErrors = (error) => {
  return error.errors.map((err) => {
    return {
      field: err.path[0],
      message: err.message
    }
  })
}

export async function validationGivePermissionToUser (object) {
  const validation = givePermissionsSchema.safeParse(object)
  if (!validation.success) { return { success: false, errors: parseErrors(validation.error) } }

  return { success: true, data: validation.data }
}
