import { decodeToken } from '../utils/JWToken.js'
import { response } from '../utils/response.js'
import { getLoggerForRoute } from '../utils/logger.js'

const logger = getLoggerForRoute('verify-auth')

export const verifyAuth = async (req, res, next) => {
  req.company = req.headers.origin == 'https://portal.spartanmeds.com' ? 2 : 1
  if (req.headers.authorization) {
    const authHeader = req.headers.authorization
    const token = authHeader.split(' ')[1]
    try {
      const decoded = decodeToken(token)

      if (decoded.exp * 1000 < Date.now()) { return res.status(401).json(response(401, 'Unauthorized')) }

      req.external_access = true
      req.auth_user = decoded
      next()
    } catch (error) {
      logger.error(error.message + error.stack.split('\n')[1])
      return res.status(401).json(response(401, 'Unauthorized'))
    }
  } else {
    const token = req.cookies.access_token
    if (!token) { return res.status(401).json(response(401, 'Unauthorized')) }

    try {
      const decoded = decodeToken(token)

      if (decoded.exp * 1000 < Date.now()) { return res.status(401).json(response(401, 'Unauthorized')) }

      req.external_access = false
      req.auth_user = decoded
      next()
    } catch (error) {
      logger.error(error.message + error.stack.split('\n')[1])
      return res.status(401).json(response(401, 'Unauthorized'))
    }
  }
}
