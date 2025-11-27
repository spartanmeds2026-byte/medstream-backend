import { getLoggerForRoute } from '../utils/logger.js'
import { response } from '../utils/response.js'
import getRelations from '../utils/relations.js'

export default class CategoryController {
  constructor({ categoryService }) {
    this.categoryService = categoryService
    this.logger = getLoggerForRoute('categories')
  }

  index = async (req, res) => {
    if (!req.permissions.list) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { page, limit, filters, sortField, sortOrder, relations } = req.query

      let _sortOrder = -1
      if (sortOrder) _sortOrder = parseInt(sortOrder)

      const results = await this.categoryService.getAll({ page, limit, filters, sortField, sortOrder: _sortOrder }, req.company)

      if (relations) {
        for (let i = 0; i < relations.length; i++) {
          const relation = relations[i]
          results.results = await getRelations(results.results, relation, 'category')
        }
      }

      return res.status(200).json(response(200, results))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }
}
