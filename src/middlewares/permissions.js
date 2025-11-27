import ModuleRepository from '../repositories/ModuleRepository.js'
import PermissionRepository from '../repositories/PermissionRepository.js'
import RoleRepository from '../repositories/RoleRepository.js'
import { UserRepository } from '../repositories/UserRepository.js'
import { response } from '../utils/response.js'

export const permissions = async (rolesIds, moduleKey) => {
  const module = await ModuleRepository.getByKey(moduleKey)

  if (!module) return null

  const rolePermissions = []

  for (const role of rolesIds) {
    const permissions = await PermissionRepository.getPermissionRoles({ role_id: role, module_id: module.id })
    rolePermissions.push(...permissions)
  }

  const modulesIds = [module.id]

  const modules = await ModuleRepository.getIn(modulesIds)
  const mappedPermissions = []
  for (const module of modules) {
    const _permissions = []
    for (const role of rolesIds) {
      const roleExists = await PermissionRepository.getPermissionRoles({ role_id: role, module_id: module.id })
      _permissions.push(...roleExists)
    }
    const _permissionsWithKeys = {}

    for (const permission of _permissions) {
      _permissionsWithKeys[permission.permissions.key] = true
    }

    const _permission = {
      ..._permissionsWithKeys
    }

    mappedPermissions.push(_permission)
  }

  return mappedPermissions.length > 0 ? mappedPermissions[0] : null
}

export const getPermissions = (module) => {
  return async (req, res, next) => {
    try {
      const user = await UserRepository.get(req.auth_user.id)

      if (!user) {
        return res.status(401).json(response(401, 'Unauthorized'))
      }

      const userRoles = await RoleRepository.getUserRoles(user.id)
      if (!userRoles?.length) {
        return res.status(403).json(response(403, 'User has no roles'))
      }

      const rolesIds = userRoles.map(role => role.role_id)

      const _permissions = await permissions(rolesIds, module)

      req.permissions = _permissions
      next()
    } catch (error) {
      next(error)
    }
  }
}
