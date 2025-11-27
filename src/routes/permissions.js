import { Router } from 'express'
import { RoleController } from '../controllers/RoleController.js'
import { PermissionController } from '../controllers/PermissionController.js'
import { ModuleController } from '../controllers/ModuleController.js'
import { verifyAuth } from '../middlewares/auth.js'
import { getPermissions } from '../middlewares/permissions.js'

export const permissionRouter = ({ permissionRepository, moduleRepository, roleRepository, userRepository }) => {
  const router = Router()
  const roleController = new RoleController({ roleRepository, permissionRepository, userRepository })
  const permissionController = new PermissionController({ permissionRepository, moduleRepository, roleRepository })
  const moduleController = new ModuleController({ moduleRepository })

  router.use(verifyAuth)

  // Routes for Modules
  router.use(getPermissions('modules'))
  router.get('/modules', moduleController.index.bind(moduleController))
  router.get('/modules/:id', moduleController.show.bind(moduleController))
  router.post('/modules', moduleController.store.bind(moduleController))
  router.put('/modules/:id', moduleController.update.bind(moduleController))
  router.delete('/modules/:id', moduleController.destroy.bind(moduleController))

  // Routes for Roles
  router.use(getPermissions('roles'))
  router.get('/roles', roleController.index.bind(roleController))
  router.get('/roles/:id', roleController.show.bind(roleController))
  router.post('/roles', roleController.store.bind(roleController))
  router.put('/roles/:id', roleController.update.bind(roleController))
  router.delete('/roles/:id', roleController.destroy.bind(roleController))

  // Routes for User Roles
  router.get('/roles/user/:userId', roleController.getUserRoles.bind(roleController))
  router.post('/roles/assign', roleController.assignUserRole.bind(roleController))
  router.delete('/roles/:roleId/user/:userId', roleController.removeUserRole.bind(roleController))

  // Routes for Permissions
  router.use(getPermissions('permissions'))
  router.get('/', permissionController.index.bind(permissionController))
  router.get('/:id', permissionController.show.bind(permissionController))
  router.get('/permissions-map/roles/:roleId/modules/:moduleId/:permission', permissionController.hasPermission.bind(permissionController))
  router.get('/permissions-map/roles/:roleId', permissionController.getRolePermissions.bind(permissionController))
  router.post('/permissions-map/roles/:roleId/modules/:moduleId', permissionController.store.bind(permissionController))
  router.post('/roles/register', permissionController.registerRole.bind(permissionController))
  router.post('/roles/revoke', permissionController.revokeRole.bind(permissionController))
  router.put('/:id', permissionController.update.bind(permissionController))
  router.delete('/:id', permissionController.destroy.bind(permissionController))

  return router
}
