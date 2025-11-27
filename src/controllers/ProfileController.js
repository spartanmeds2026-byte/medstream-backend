import { response } from '../utils/response.js'
import { randomUUID, createHash } from 'crypto'
import { validationProfile } from '../validations/profiles/profile.js'
import { validationPassword } from '../validations/profiles/password.js'
import { getLoggerForRoute } from '../utils/logger.js'

export class ProfileController {
  constructor({ userRepository, storageRepository, roleRepository, permissionRepository, moduleRepository }) {
    this.roleRepository = roleRepository
    this.permissionRepository = permissionRepository
    this.userRepository = userRepository
    this.moduleRepository = moduleRepository
    this.storageRepository = new storageRepository()
    this.logger = getLoggerForRoute('profile')
  }

  update = async (req, res) => {
    try {
      const userId = req.auth_user.id
      const data = req.body

      const profileSchema = await validationProfile(data)
      if (!profileSchema.success) {
        return res.status(400).json(response(400, profileSchema.errors))
      }

      const userData = {
        first_name: data.first_name,
        last_name: data.last_name
      }

      const updatedUser = await this.userRepository.update(userId, userData)

      return res.status(200).json(response(200, updatedUser))
    } catch (error) {
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  updatePassword = async (req, res) => {
    try {
      const passwordSchema = await validationPassword(req.body)
      if (!passwordSchema.success) {
        return res.status(400).json(response(400, passwordSchema.errors))
      }

      const { password, new_password } = req.body
      const userId = req.auth_user.id
      const user = await this.userRepository.get(userId)

      if (!user) {
        return res.status(404).json(response(404, 'User not found'))
      }

      const userByEmail = await this.userRepository.getByEmail(user.email, {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        password: true,
        password_token: true
      })

      const isPasswordCorrect = await this.userRepository.verifyPassword(userByEmail, password)
      if (!isPasswordCorrect) {
        return res.status(401).json(response(401, 'Current password is incorrect'))
      }

      const passwordToken = randomUUID()
      const hashedNewPassword = createHash('sha256').update(new_password + user.email + passwordToken).digest('hex')

      await this.userRepository.update(userId, {
        password: hashedNewPassword,
        password_token: passwordToken
      })

      const updatedUser = await this.userRepository.get(userId)

      return res.status(200).json(response(200, updatedUser, 'Password updated successfully'))
    } catch (error) {
      this.logger.error(error)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  updatePicture = async (req, res) => {
    try {
      const userId = req.auth_user.id
      const { picture } = req.body

      if (!picture) {
        return res.status(400).json(response(400, 'Picture is required'))
      }

      const s3Picture = await this.storageRepository.upload(picture, 'users', userId)

      const userData = {
        picture: s3Picture
      }

      const updatePicture = await this.userRepository.update(userId, userData)

      return res.status(200).json(response(200, updatePicture, 'success'))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  whoAmI = async (req, res) => {
    const user = await this.userRepository.get(req.auth_user.id)

    if (!user) return res.status(404).json(response(404, 'User not found'))

    return res.status(200).json(response(200, req.auth_user))
  }

  permissionsMap = async (req, res) => {
    try {
      const userRoles = await this.roleRepository.getUserRoles(req.auth_user.id)
      if (!userRoles?.length) {
        return res.status(403).json(response(403, 'User has no roles'))
      }

      const rolesIds = userRoles.map(role => role.role_id)

      const rolePermissions = []

      for (const role of rolesIds) {
        const permissions = await this.permissionRepository.getPermissionRoles({ role_id: role })
        rolePermissions.push(...permissions)
      }

      let modulesIds = rolePermissions.map(p => p.module_id)
      // Array unique
      modulesIds = modulesIds.filter((value, index) => modulesIds.indexOf(value) === index)

      const modules = await this.moduleRepository.getIn(modulesIds)
      const mappedPermissions = {}
      for (const module of modules) {
        const _permissions = []
        for (const role of rolesIds) {
          const roleExists = await this.permissionRepository.getPermissionRoles({ role_id: role, module_id: module.id })
          _permissions.push(...roleExists)
        }
        const _permissionsWithKeys = {}

        for (const permission of _permissions) {
          _permissionsWithKeys[permission.permissions.key] = true
        }

        mappedPermissions[module.key] = _permissionsWithKeys
      }

      return res.status(200).json(response(200, mappedPermissions))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }
}
