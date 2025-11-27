import { Router } from 'express'
import { ProfileController } from '../controllers/ProfileController.js'
import { verifyAuth } from '../middlewares/auth.js'

export const createProfileRouter = ({ userRepository, storageRepository, roleRepository, permissionRepository, moduleRepository }) => {
  const profileRouter = Router()
  profileRouter.use(verifyAuth)
  const profileController = new ProfileController({ userRepository, storageRepository, roleRepository, permissionRepository, moduleRepository })

  profileRouter.put('/update', profileController.update)
  profileRouter.put('/update/password', profileController.updatePassword)
  profileRouter.put('/update/picture', profileController.updatePicture)
  profileRouter.get('/check/whoami', profileController.whoAmI)

  profileRouter.get('/permissions/map', profileController.permissionsMap.bind(profileController))

  return profileRouter
}
