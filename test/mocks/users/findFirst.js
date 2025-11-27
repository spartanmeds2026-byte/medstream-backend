import { prismaMock } from '../../../singleton.ts'

export const findFirst = async () => {
  prismaMock.users.findFirst.mockResolvedValue({
    id: 1,
    first_name: 'Ysmael',
    last_name: '@ S9',
    email: 'ysmael@s9-consulting.com',
    picture: 'https://hlas2e3nhoxqgvcl.public.blob.vercel-storage.com/users/1-o6d6Cw1WKvcqZwPypnsqyjlSAbYlE0.png',
    password: '305e36df7790666986e2530473ec9af3d20d3e040e9b63bf61d97a4d01a1b3a6',
    password_token: '7fab885b-0f2d-4111-9e47-1e8b1818d902',
    created_at: '2024-07-10T14:55:20.357Z',
    updated_at: null,
    super_admin: true,
    created_by: null,
    updated_by: null
  })
}

export const findFirstNull = async () => {
  prismaMock.users.findFirst.mockResolvedValue(null)
}
