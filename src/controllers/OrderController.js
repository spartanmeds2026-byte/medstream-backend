import { getLoggerForRoute } from '../utils/logger.js'
import { response } from '../utils/response.js'

export default class OrderController {
  constructor({ orderService }) {
    this.orderService = orderService
    this.logger = getLoggerForRoute('orders')
  }

  index = async (req, res) => {
    if (!req.permissions.list) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const result = await this.orderService.index(req)

      return res.status(result.code).json(result)
    } catch (error) {
      this.logger.error(error.message + error.stack.split('\n')[1])
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  show = async (req, res) => {
    if (!req.permissions.read) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const result = await this.orderService.show(req)

      return res.status(result.code).json(result)
    } catch (error) {
      this.logger.error(error.message + error.stack.split('\n')[1])
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  store = async (req, res) => {
    if (!req.permissions.create) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const result = await this.orderService.store(req)

      return res.status(result.code).json(result)
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  update = async (req, res) => {
    if (!req.permissions.update) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const result = await this.orderService.update(req)

      return res.status(result.code).json(result)
    } catch (error) {
      this.logger.error(`${error.message} ${error.stack.split('\n')[1]}`)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  destroy = async (req, res) => {
    if (!req.permissions.del) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const result = await this.orderService.destroy(req)

      return res.status(result.code).json(result)
    } catch (error) {
      this.logger.error(error.message + error.stack.split('\n')[1])
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  getHistoryByProduct = async (req, res) => {
    try {
      const { id } = req.params
      const results = await this.orderService.getOrdersByProduct(id)

      return res.status(results.code).json(results)
    } catch (error) {
      this.logger.error(error.message + error.stack.split('\n')[1])
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  productOrders = async (req, res) => {
    if (!req.permissions.list) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { id } = req.params
      const results = await this.orderService.getProductOrders(id)

      return res.status(results.code).json(results)
    } catch (error) {
      this.logger.error(error.message + error.stack.split('\n')[1])
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  getDraftOrders = async (req, res) => {
    if (!req.permissions.list) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const results = await this.orderService.getDraftOrders(req)

      return res.status(results.code).json(results)
    } catch (error) {
      this.logger.error(error.message + error.stack.split('\n')[1])
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  draftStore = async (req, res) => {
    if (!req.permissions.create) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const result = await this.orderService.store(req)

      return res.status(result.code).json(result)
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }
}
