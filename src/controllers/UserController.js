import { getLoggerForRoute } from '../utils/logger.js'
import getRelations from '../utils/relations.js'
import { response } from '../utils/response.js'
import { validationUser } from '../validations/users/create.js'
import { validationUpdateUser } from '../validations/users/update.js'

export class UserController {
  constructor ({ userRepository, storageRepository, userRoleRepository, clientRepository }) {
    this.userRepository = userRepository
    this.storageRepository = new storageRepository()
    this.userRoleRepository = userRoleRepository
    this.clientRepository = clientRepository
    this.logger = getLoggerForRoute('users')
  }

  index = async (req, res) => {
    if (!req.permissions.list) return res.status(403).json(response(403, 'User has no permissions'))
    try {
      const params = req.query
      let page = 1
      if (params?.page) { page = parseInt(params.page) }

      const limit = params?.limit ? parseInt(params.limit) : undefined

      const { relations } = params

      const results = await this.userRepository.getAll({ page, limit })
      if (relations) {
        for (let i = 0; i < relations.length; i++) {
          const relation = relations[i]

          results.results = await getRelations(results.results, relation, 'user')
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
      if (!req.params?.id) { return res.status(400).json(response(400, 'Bad request')) }

      const { id } = req.params

      const user = await this.userRepository.get(id)

      if (!user) { return res.status(404).json(response(404, 'User not found')) }

      return res.status(200).json(response(200, user))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  store = async (req, res) => {
    if (!req.permissions.create) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const data = req.body
      const userSchema = await validationUser(data)
      if (!userSchema.success) {
        return res.status(400).json(response(400, userSchema.errors))
      }

      const userExists = await this.userRepository.getByEmail(data.email)
      if (userExists) { return res.status(409).json(response(409, 'User already exists')) }

      const userData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        role: data.role,
        created_by: req.auth_user?.id || null
      }

      /**
       * Upload picture to S3
      if (data.picture) {
        const s3Picture = await this.storageRepository.upload(data.picture, 'users')
        userData.picture = s3Picture
      }
      */

      const createdUser = await this.userRepository.create(userData)

      return res.status(200).json(response(200, createdUser))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  update = async (req, res) => {
    if (!req.permissions.update) return res.status(403).json(response(403, 'Forbidden'))
    try {
      if (!req.params?.id) { return res.status(400).json(response(400, 'Bad request')) }

      const { id } = req.params
      const data = req.body
      const userSchema = await validationUpdateUser(data)
      if (!userSchema.success) {
        return res.status(400).json(response(400, userSchema.errors))
      }

      const user = await this.userRepository.get(id)
      if (!user) { return res.status(404).json(response(404, 'User not found')) }

      let userData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        role: data.role
      }
      let s3Picture = null
      if (data.picture) {
        s3Picture = await this.storageRepository.upload(data.picture, 'users', user.id)
        userData = { ...userData, picture: s3Picture }
      }

      if (data.password) {
        const userByEmail = await this.userRepository.getById(id, {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          password: true,
          password_token: true
        })
        console.log(userByEmail)
        if (!userByEmail) {
          return res.status(404).json(response(404, 'User not found for email'))
        }
        const password = await this.userRepository.hash(userByEmail, data.password)
        userData = { ...userData, password }
      }

      const updatedUser = await this.userRepository.update(id, userData)

      return res.status(200).json(response(200, updatedUser))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  destroy = async (req, res) => {
    if (!req.permissions.del) return res.status(403).json(response(403, 'Forbidden'))
    try {
      if (!req.params?.id) { return res.status(400).json(response(400, 'Bad request')) }

      const { id } = req.params

      const user = await this.userRepository.get(id)
      if (!user) { return res.status(404).json(response(404, 'User not found')) }

      await this.userRepository.delete(id)

      return res.status(200).json(response(200, 'User deleted'))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  assignAdminRole = async (req, res) => {
    if (!req.permissions.update) return res.status(403).json(response(403, 'Forbidden'))
    try {
      if (!req.params?.id) { return res.status(400).json(response(400, 'Bad request')) }

      const { id } = req.params

      const user = await this.userRepository.get(id)
      if (!user) { return res.status(404).json(response(404, 'User not found')) }

      
      const existingAdminRoles = await this.userRoleRepository.getPermissionsByUserId(id)
      const adminRole = existingAdminRoles?.find(userRole => userRole.role_id === 1)

      if (adminRole) {
        // Remove admin role
        await this.userRoleRepository.delete(adminRole.id)
        
        // Check if user has any other roles
        const remainingRoles = await this.userRoleRepository.getPermissionsByUserId(id)
        
        // If no roles left, assign default role (id 5)
        if (!remainingRoles || remainingRoles.length === 0) {
          await this.userRoleRepository.create({
            user_id: parseInt(id),
            role_id: 5,
            created_by: req.auth_user?.id || null
          })
          return res.status(200).json(response(200, 'Admin role removed and default role assigned'))
        }
        
        return res.status(200).json(response(200, 'Admin role removed successfully'))
      } else {
        // Assign admin role (id 1) to user
        await this.userRoleRepository.create({
          user_id: parseInt(id),
          role_id: 1
        })
        return res.status(200).json(response(200, 'Admin role assigned successfully'))
      }
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  assignClient = async (req, res) => {
    if (!req.permissions.create) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { userId, clientId } = req.params

      if (!userId || !clientId) {
        return res.status(400).json(response(400, 'User ID and Client ID are required'))
      }

      // Validate that user exists
      const user = await this.userRepository.get(userId)
      if (!user) {
        return res.status(404).json(response(404, 'User not found'))
      }

      // Validate that client exists
      const client = await this.clientRepository.get(clientId)
      if (!client) {
        return res.status(404).json(response(404, 'Client not found'))
      }

      // Assign client to user
      const result = await this.clientRepository.assignClientToUser(userId, clientId, req.auth_user?.id)

      return res.status(200).json(response(200, 'Client assigned to user successfully'))
    } catch (error) {
      if (error.message === 'User is already associated with this client') {
        return res.status(409).json(response(409, error.message))
      }
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  unassignmentClient = async (req, res) => {
    if (!req.permissions.update) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { userId, clientId } = req.params

      if (!userId) {
        return res.status(400).json(response(400, 'User ID and Client ID are required'))
      }

      // Validate that user exists
      const user = await this.userRepository.get(userId)
      if (!user) {
        return res.status(404).json(response(404, 'User not found'))
      }

      // Unlink client from user
      const result = await this.clientRepository.unassignmentClientFromUser(userId)

      return res.status(200).json(response(200, 'Client unlinked from user successfully'))
    } catch (error) {
      if (error.message === 'User is not associated with this client') {
        return res.status(404).json(response(404, error.message))
      }
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }
}
