import { z } from 'zod'

const assignPermissionsSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' })
})

const parseErrors = (error) => {
  return error.errors.map((err) => {
    return {
      field: err.path[0],
      message: err.message
    }
  })
}

export async function validationAssignPermissions (object) {
  const validation = assignPermissionsSchema.safeParse(object)
  if (!validation.success) { return { success: false, errors: parseErrors(validation.error) } }

  return { success: true, data: validation.data }
}
