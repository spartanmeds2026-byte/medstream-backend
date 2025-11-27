import { Router } from 'express'
import { UserController } from '../controllers/UserController.js'
import { ClientController } from '../controllers/ClientController.js'
import { verifyAuth } from '../middlewares/auth.js'
import { getPermissions } from '../middlewares/permissions.js'

export const createUserRouter = ({ userRepository, storageRepository, userRoleRepository, clientRepository, sendgridRepository }) => {
  const userRouter = Router()
  userRouter.use(verifyAuth)
  const userController = new UserController({ userRepository, storageRepository, userRoleRepository, clientRepository })

  userRouter.use(getPermissions('users'))
  userRouter.get('/', userController.index)
  userRouter.post('/', userController.store)
  userRouter.get('/:id', userController.show)
  userRouter.get('/:id/role/assignment/admin', userController.assignAdminRole)
  userRouter.get('/:userId/assignment/:clientId', userController.assignClient)
  userRouter.delete('/:userId/unassignment', userController.unassignmentClient)
  userRouter.put('/:id', userController.update)
  userRouter.delete('/:id', userController.destroy)

  const clientController = new ClientController({ clientRepository, storageRepository, userRoleRepository, sendgridRepository })
  userRouter.use(getPermissions('contacts'))
  userRouter.get('/:id/invite', clientController.invite.bind(clientController))

  return userRouter
}
