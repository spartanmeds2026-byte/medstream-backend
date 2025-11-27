import { z } from 'zod'

const schema = z.object({
  // firstName: z.string().min(1, 'First Name is required'),
  // lastName: z.string().min(1, 'Last Name is required'),
  // state: z.string().min(1, 'State is required'),
  // city: z.string().min(1, 'City is required')
})

const parseErrors = (error) => {
  return error.errors.map((err) => {
    return {
      field: err.path[0],
      message: err.message
    }
  })
}

export async function validationClientCreate(object) {
  const validation = schema.safeParse(object)

  if (!validation.success) { return { success: false, errors: parseErrors(validation.error) } }

  return { success: true, data: validation.data }
}
