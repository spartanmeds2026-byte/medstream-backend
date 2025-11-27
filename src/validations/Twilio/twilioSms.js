import { z } from 'zod'

const twilioSchema = z.object({
  to: z.string().min(10),
  body: z.string()
})

const parseErrors = (error) => {
  return error.errors.map((err) => {
    return {
      field: err.path[0],
      message: err.message
    }
  })
}

export async function validationTwilio (object) {
  const validation = twilioSchema.safeParse(object)
  if (!validation.success) { return { success: false, errors: parseErrors(validation.error) } }

  return { success: true, data: validation.data }
}
