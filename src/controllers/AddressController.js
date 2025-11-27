import { getLoggerForRoute } from '../utils/logger.js'
import { response } from '../utils/response.js'

export default class AddressController {
  constructor({ addressService }) {
    this.addressService = addressService
    this.logger = getLoggerForRoute('address')
  }

  index = async (req, res) => {
    if (!req.permissions.list) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const result = await this.addressService.getByUser(req.auth_user.id)

      return res.status(result.code).json(result)
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  store = async (req, res) => {
    if (!req.permissions.create) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const result = await this.addressService.create(req.body, req.auth_user.id)

      return res.status(result.code).json(result)
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }
}
