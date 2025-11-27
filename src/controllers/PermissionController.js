import { getLoggerForRoute } from '../utils/logger.js'
import getRelations from '../utils/relations.js'
import { response } from '../utils/response.js'
import { validationCreate } from '../validations/permissions/create.js'

export class PermissionController {
  constructor({ permissionRepository, moduleRepository, roleRepository }) {
    this.permissionRepository = permissionRepository
    this.moduleRepository = moduleRepository
    this.roleRepository = roleRepository
    this.logger = getLoggerForRoute('permissions')
  }

  index = async (req, res) => {
    if (!req.permissions.list) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { page, limit, filters, sortField, sortOrder, relations } = req.query

      let _sortOrder = -1
      if (sortOrder) _sortOrder = parseInt(sortOrder)

      const results = await this.permissionRepository.getAll({ page, limit, filters, sortField, sortOrder: _sortOrder })

      if (relations) {
        for (let i = 0; i < relations.length; i++) {
          const relation = relations[i]

          results.results = await getRelations(results.results, relation, 'permission')
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

      if (isNaN(parseInt(id))) return res.status(400).json(response(400, 'Permission ID is required'))

      const result = await this.permissionRepository.get(id)
      if (!result) return res.status(404).json(response(404, 'Permission not found'))

      return res.status(200).json(response(200, result))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  store = async (req, res) => {
    if (!req.permissions.create) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const validationSchema = await validationCreate(req.body)
      if (!validationSchema.success) return res.status(400).json(response(400, validationSchema.errors))

      const { name, key } = req.body
      const existingRecord = await this.permissionRepository.getByKey(key)
      if (existingRecord) return res.status(409).json(response(409, 'Permission already exists'))

      const result = await this.permissionRepository.create({ name, key, createdBy: req.auth_user.id })

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

      const existingRecord = await this.permissionRepository.get(id)
      if (!existingRecord) return res.status(404).json(response(404, 'Permission not found'))

      if (key) {
        const existingPermissionWithKey = await this.permissionRepository.getByKey(key)
        if (existingPermissionWithKey && existingPermissionWithKey.id !== parseInt(id)) {
          return res.status(409).json(response(409, 'Permission with this key already exists'))
        }
      }

      const result = await this.permissionRepository.update(id, {
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

      if (isNaN(parseInt(id))) return res.status(400).json(response(400, 'Permission ID is required'))

      const existingRecord = await this.permissionRepository.get(id)
      if (!existingRecord) return res.status(404).json(response(404, 'Permission not found'))

      const result = await this.permissionRepository.archive(id)

      return res.status(200).json(response(200, result))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  getRolePermissions = async (req, res) => {
    if (!req.permissions.read) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { roleId } = req.params

      const roleExists = await this.roleRepository.get(roleId)
      if (!roleExists) return res.status(404).json(response(404, 'Role not found'))

      const rolePermissions = await this.permissionRepository.getPermissionRoles({ role_id: roleId })

      if (!rolePermissions || rolePermissions.length === 0) {
        return res.status(404).json(response(404, 'No permissions found for this role'))
      }

      let modulesIds = rolePermissions.map(p => p.module_id)
      // Array unique
      modulesIds = modulesIds.filter((value, index) => modulesIds.indexOf(value) === index)

      const modules = await this.moduleRepository.getIn(modulesIds)
      const mappedPermissions = []
      for (const module of modules) {
        const _permissions = await this.permissionRepository.getPermissionRoles({ role_id: roleId, module_id: module.id })
        const _permissionsWithKeys = {}

        for (const permission of _permissions) {
          _permissionsWithKeys[permission.permissions.key] = true
        }

        const _permission = {
          module_id: module.id,
          role_id: roleExists.id,
          ..._permissionsWithKeys,
          roles: {
            name: roleExists.name,
            key: roleExists.key
          },
          modules: {
            name: module.name,
            key: module.key
          }
        }

        mappedPermissions.push(_permission)
      }

      return res.status(200).json(response(200, mappedPermissions))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  registerRole = async (req, res) => {
    if (!req.permissions.create) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { roleId, moduleId, permissionId } = req.body

      if (!roleId || !moduleId || !permissionId) return res.status(400).json(response(400, 'Role ID, Module ID and Permission ID are required'))

      const role = await this.roleRepository.get(roleId)
      if (!role) return res.status(404).json(response(404, 'Role not found'))

      const module = await this.moduleRepository.get(moduleId)
      if (!module) return res.status(404).json(response(404, 'Module not found'))

      const permission = await this.permissionRepository.get(permissionId)
      if (!permission) return res.status(404).json(response(404, 'Permission not found'))

      const existingRecord = await this.permissionRepository.check(role.id, permission.id, module.id)
      if (existingRecord) return res.status(409).json(response(409, 'Role already has this permission'))

      const result = await this.permissionRepository.register(role.id, permission.id, module.id)

      return res.status(200).json(response(200, result))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  revokeRole = async (req, res) => {
    if (!req.permissions.del) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { roleId, moduleId, permissionId } = req.body

      if (!roleId || !moduleId || !permissionId) return res.status(400).json(response(400, 'Role ID, Module ID and Permission ID are required'))

      const role = await this.roleRepository.get(roleId)
      if (!role) return res.status(404).json(response(404, 'Role not found'))

      const module = await this.moduleRepository.get(moduleId)
      if (!module) return res.status(404).json(response(404, 'Module not found'))

      const permission = await this.permissionRepository.get(permissionId)
      if (!permission) return res.status(404).json(response(404, 'Permission not found'))

      const existingRecord = await this.permissionRepository.check(role.id, permission.id, module.id)
      if (!existingRecord) return res.status(404).json(response(404, 'Role does not have this permission'))

      await this.permissionRepository.revoke(role.id, permission.id, module.id)

      return res.status(200).json(response(200, 'Permission revoked successfully'))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  hasPermission = async (req, res) => {
    if (!req.permissions.read) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { roleId, moduleId, permission } = req.params

      const roleExists = await this.roleRepository.get(roleId)
      if (!roleExists) return res.status(404).json(response(404, 'Role not found'))

      const moduleExists = await this.moduleRepository.get(moduleId)
      if (!moduleExists) return res.status(404).json(response(404, 'Module not found'))

      const permissionExists = await this.permissionRepository.getByKey(permission)
      if (!permissionExists) return res.status(404).json(response(404, 'Permission not found'))

      const result = await this.permissionRepository.getPermissionRoles({ role_id: roleExists.id, module_id: moduleExists.id, permission_id: permissionExists.id })

      return res.status(200).json(response(200, result && result.length > 0))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  getPermissions = async (req, res) => {
    if (!req.permissions.read) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { roleId } = req.params

      const roleExists = await this.roleRepository.get(roleId)
      if (!roleExists) return res.status(404).json(response(404, 'Role not found'))

      const rolePermissions = await this.permissionRepository.getPermissionRoles({ role_id: roleExists.id })

      return res.status(200).json(response(200, rolePermissions))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }
}
