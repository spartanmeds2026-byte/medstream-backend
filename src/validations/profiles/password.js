import { z } from 'zod'

const passwordSchema = z.object({
  password: z.string(),
  new_password: z.string()
    .min(8)
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
  confirm_new_password: z.string()
}).refine(data => data.new_password === data.confirm_new_password, {
  message: 'Passwords do not match',
  path: ['confirm_new_password']
})

const parseErrors = (error) => {
  return error.errors.map((err) => {
    return {
      field: err.path[0],
      message: err.message
    }
  })
}

export async function validationPassword (object) {
  const validation = passwordSchema.safeParse(object)
  if (!validation.success) {
    return { success: false, errors: parseErrors(validation.error) }
  }

  return { success: true, data: validation.data }
}
