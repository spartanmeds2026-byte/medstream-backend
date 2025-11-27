import { getLoggerForRoute } from '../utils/logger.js'
import { response } from '../utils/response.js'
import { validationRole } from '../validations/roles/create.js'
import getRelations from '../utils/relations.js'

export class RoleController {
  constructor ({ permissionRepository, roleRepository, userRepository }) {
    this.roleRepository = roleRepository
    this.permissionRepository = permissionRepository
    this.userRepository = userRepository
    this.logger = getLoggerForRoute('roles')
  }

  index = async (req, res) => {
    if (!req.permissions.list) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { page, limit, filters, sortField, sortOrder, relations } = req.query

      let _sortOrder = -1
      if (sortOrder) _sortOrder = parseInt(sortOrder)

      const results = await this.roleRepository.getAll({ page, limit, filters, sortField, sortOrder: _sortOrder })

      if (relations) {
        for (let i = 0; i < relations.length; i++) {
          const relation = relations[i]

          results.results = await getRelations(results.results, relation, 'role')
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

      const result = await this.roleRepository.get(id)
      if (!result) return res.status(404).json(response(404, 'Role not found'))

      return res.status(200).json(response(200, result))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  store = async (req, res) => {
    if (!req.permissions.create) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const validationSchema = await validationRole(req.body)
      if (!validationSchema.success) return res.status(400).json(response(400, validationSchema.errors))

      const { name, key } = req.body
      const existingRecord = await this.roleRepository.getByKey(key)
      if (existingRecord) return res.status(409).json(response(409, 'Role already exists'))

      const result = await this.roleRepository.create({ name, key }, req.auth_user.id)

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

      const existingRecord = await this.roleRepository.get(id)
      if (!existingRecord) return res.status(404).json(response(404, 'Role not found'))

      const result = await this.roleRepository.update(id, {
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

      if (isNaN(parseInt(id))) return res.status(400).json(response(400, 'Role ID is required'))

      const existingRecord = await this.roleRepository.get(id)
      if (!existingRecord) return res.status(404).json(response(404, 'Role not found'))

      const result = await this.roleRepository.delete(id)

      return res.status(200).json(response(200, result))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  assignUserRole = async (req, res) => {
    if (!req.permissions.create) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { userId, roleId } = req.body

      if (!userId || !roleId) {
        return res.status(400).json(response(400, 'User ID and Role ID are required'))
      }

      const user = await this.userRepository.get(userId)
      if (!user) return res.status(404).json(response(404, 'User not found'))

      const role = await this.roleRepository.get(roleId)
      if (!role) return res.status(404).json(response(404, 'Role not found'))

      const existingUserRole = await this.roleRepository.checkUser(roleId, userId)
      if (existingUserRole) {
        return res.status(409).json(response(409, 'User already has this role'))
      }

      const result = await this.roleRepository.assignUserRole(roleId, userId, req.auth_user.id)

      return res.status(201).json(response(201, result))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  removeUserRole = async (req, res) => {
    if (!req.permissions.del) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { userId, roleId } = req.params

      if (!userId || !roleId) {
        return res.status(400).json(response(400, 'User ID and Role ID are required'))
      }

      const user = await this.userRepository.get(userId)
      if (!user) return res.status(404).json(response(404, 'User not found'))

      const role = await this.roleRepository.get(roleId)
      if (!role) return res.status(404).json(response(404, 'Role not found'))

      const existingUserRole = await this.roleRepository.checkUser(roleId, userId)
      if (!existingUserRole) {
        return res.status(404).json(response(404, 'User role not found'))
      }

      const result = await this.roleRepository.removeUserRole(existingUserRole.id)

      return res.status(200).json(response(200, result))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  getUserRoles = async (req, res) => {
    if (!req.permissions.read) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { userId } = req.params

      const userRoles = await this.roleRepository.getUserRoles(userId)
      if (!userRoles) return res.status(404).json(response(404, 'User roles not found'))

      const roleIds = userRoles.map(role => role.role_id)

      const result = await this.roleRepository.getRolesByIds(roleIds)

      return res.status(200).json(response(200, result))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }
}
