import { z } from 'zod'

const userSchema = z.object({
  first_name: z.string()
    .min(2, { message: 'the name must be at least 2 characters' })
    .max(50, { message: 'the name cannot exceed 50 characters' }),
  /* last_name: z.string()
    .min(2, { message: 'the last name must be at least 2 characters' })
    .max(50, { message: 'the last name cannot exceed 50 characters' }), */
  email: z.string()
    .email({ message: 'invalid email' })
    .toLowerCase(),
  password: z.string()
    .min(8, { message: 'the password must be at least 8 characters' })
    .regex(/[a-z]/, { message: 'the password must contain at least one lowercase letter' })
    .regex(/[A-Z]/, { message: 'the password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'the password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'the password must contain at least one special character' })
})

const parseErrors = (error) => {
  return error.errors.map((err) => {
    return {
      field: err.path[0],
      message: err.message
    }
  })
}

export async function validationUser (object) {
  const validation = userSchema.safeParse(object)
  if (!validation.success) { return { success: false, errors: parseErrors(validation.error) } }

  return { success: true, data: validation.data }
}
