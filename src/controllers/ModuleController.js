import { getLoggerForRoute } from '../utils/logger.js'
import { response } from '../utils/response.js'
import { validationModule } from '../validations/modules/create.js'
import getRelations from '../utils/relations.js'

export class ModuleController {
  constructor({ moduleRepository }) {
    this.moduleRepository = moduleRepository
    this.logger = getLoggerForRoute('modules')
  }

  index = async (req, res) => {
    if (!req.permissions.list) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { page, limit, filters, sortField, sortOrder, relations } = req.query

      let _sortOrder = -1
      if (sortOrder) _sortOrder = parseInt(sortOrder)

      const results = await this.moduleRepository.getAll({ page, limit, filters, sortField, sortOrder: _sortOrder })

      if (relations) {
        for (let i = 0; i < relations.length; i++) {
          const relation = relations[i]

          results.results = await getRelations(results.results, relation, 'module')
        }
      }

      return res.status(200).json(response(200, results))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  show = async (req, res) => {
    if (!req.permissions.read) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { id } = req.params

      const result = await this.moduleRepository.get(id)
      if (!result) return res.status(404).json(response(404, 'Module not found'))

      return res.status(200).json(response(200, result))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  store = async (req, res) => {
    if (!req.permissions.create) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const validationSchema = await validationModule(req.body)
      if (!validationSchema.success) return res.status(400).json(response(400, validationSchema.errors))

      const { name, key } = req.body
      const existingRecord = await this.moduleRepository.getByKey(key)
      if (existingRecord) return res.status(409).json(response(409, 'Role already exists'))

      const result = await this.moduleRepository.create({ name, key, createdBy: req.auth_user.id })

      return res.status(201).json(response(201, result))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  update = async (req, res) => {
    if (!req.permissions.update) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { id } = req.params
      const { name, key } = req.body

      const existingRecord = await this.moduleRepository.get(id)
      if (!existingRecord) return res.status(404).json(response(404, 'Module not found'))

      const result = await this.moduleRepository.update(id, {
        name,
        key,
        updatedBy: req.auth_user.id
      })

      return res.status(200).json(response(200, result))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  destroy = async (req, res) => {
    if (!req.permissions.del) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { id } = req.params

      const existingRecord = await this.moduleRepository.get(id)
      if (!existingRecord) return res.status(404).json(response(404, 'Module not found'))

      const result = await this.moduleRepository.archive(id)

      return res.status(200).json(response(200, result))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }
}
