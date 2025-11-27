import { z } from 'zod'

const sendgridSchema = z.object({
  to: z.string().email(),
  from: z.string().email(),
  subject: z.string(),
  text: z.string().optional(),
  html: z.string().optional()
})

const parseErrors = (error) => {
  return error.errors.map((err) => {
    return {
      field: err.path[0],
      message: err.message
    }
  })
}

export async function validationSendgrid (object) {
  const validation = sendgridSchema.safeParse(object)
  if (!validation.success) { return { success: false, errors: parseErrors(validation.error) } }

  return { success: true, data: validation.data }
}
