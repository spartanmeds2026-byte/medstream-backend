import { z } from 'zod'

const profileSchema = z.object({
  first_name: z.string()
    .min(2, { message: 'the name must be at least 2 characters' })
    .max(50, { message: 'the name cannot exceed 50 characters' })
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'the name can only contain letters' }),
  last_name: z.string()
    .min(2, { message: 'the last name must be at least 2 characters' })
    .max(50, { message: 'the last name cannot exceed 50 characters' })
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'the last name can only contain letters' }),
  email: z.string()
    .email({ message: 'invalid email' })
    .toLowerCase(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'invalid phone number' })
    .optional()
})

const parseErrors = (error) => {
  return error.errors.map((err) => {
    return {
      field: err.path[0],
      message: err.message
    }
  })
}

export async function validationProfile (object) {
  const validation = profileSchema.safeParse(object)
  if (!validation.success) {
    return { success: false, errors: parseErrors(validation.error) }
  }

  return { success: true, data: validation.data }
}
