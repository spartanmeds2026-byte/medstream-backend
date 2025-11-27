import jwt from 'jsonwebtoken'
import 'dotenv/config'
export const createToken = (payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET_TOKEN, { expiresIn: '1h' })

  return token
}

export const decodeToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN)

  return decoded
}

export const isExpiredToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN)

  if (decoded.exp * 1000 < Date.now()) return true

  return false
}
