import 'dotenv/config'
import { response } from '../utils/response.js'
import { getLoggerForRoute } from '../utils/logger.js'

export class AuthController {
  constructor({ authService }) {
    this.authService = authService
    this.logger = getLoggerForRoute('auth')
  }

  login = async (req, res) => {
    try {
      const { email } = req.body
      const result = await this.authService.login(email, req.headers.origin)

      return res.status(result.code).json(result)
    } catch (error) {
      return res.status(500).json(response(500, error.message))
    }
  }

  smsLogin = async (req, res) => {
    try {
      const { phone } = req.body

      const result = await this.authService.smsLogin(phone)

      return res.status(result.code).json(result)
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, error.message))
    }
  }

  smsLoginVerify = async (req, res) => {
    try {
      const { code, method_id } = req.body

      const result = await this.authService.smsLoginVerify(code, method_id)

      const { user, access_token } = result.data

      return res
        .cookie('access_token', access_token, {
          httpOnly: true,
          secure: process.env.PROJECT_ENV === 'production',
          sameSite: process.env.PROJECT_ENV === 'production' ? 'None' : 'Lax'
        })
        .status(result.code).json(response(result.code,user || result.data))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, error.message))
    }
  }

  passwordLogin = async (req, res) => {
    try {
      const { email, password } = req.body

      const result = await this.authService.passwordLogin(email, password)

      const { user, access_token } = result.data

      return res
        .cookie('access_token', access_token, {
          httpOnly: true,
          secure: process.env.PROJECT_ENV === 'production',
          sameSite: process.env.PROJECT_ENV === 'production' ? 'None' : 'Lax'
        })
        .status(result.code).json(response(result.code, user || result.data))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  callback = async (req, res) => {
    try {
      const { stytch_token_type, token } = req.query

      const result = await this.authService.callback(stytch_token_type, token)

      const { user, access_token } = result.data

      return res
        .cookie('access_token', access_token, {
          httpOnly: true,
          secure: process.env.PROJECT_ENV === 'production',
          sameSite: process.env.PROJECT_ENV === 'production' ? 'None' : 'Lax'
        })
        .status(result.code).json(response(result.code, user || result.data))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(503).json(response(503, 'Service unavailable'))
    }
  }

  logout = async (req, res) => {
    try {
      res.clearCookie('access_token', '', {
        httpOnly: true,
        secure: process.env.PROJECT_ENV === 'production',
        sameSite: 'None',
        expires: new Date(0),
        path: '/'
      })

      const userId = req.auth_user ? req.auth_user.id : 'unknown'
      this.logger.info(`Cookie "access_token" cleared for user: ${userId} at ${new Date().toISOString()}`)

      return res.status(200).json(response(200, 'Logout success'))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  simulate = async (req, res) => {
    if (!req.permissions.update) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { user_id } = req.body

      const result = await this.authService.simulateLogin(user_id, req.auth_user.id)

      const { user, access_token } = result.data

      return res
        .cookie('access_token', access_token, {
          httpOnly: true,
          secure: process.env.PROJECT_ENV === 'production',
          sameSite: process.env.PROJECT_ENV === 'production' ? 'None' : 'Lax'
        })
        .status(result.code).json(response(result.code, user))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  exitSimulation = async (req, res) => {
    try {
      console.log(req.auth_user)
      if (!req.auth_user.admin_id) return res.status(403).json(response(403, 'Forbidden'))

      const result = await this.authService.exitSimulateLogin(parseInt(req.auth_user.admin_id))

      const { user, access_token } = result.data

      return res
        .cookie('access_token', access_token, {
          httpOnly: true,
          secure: process.env.PROJECT_ENV === 'production',
          sameSite: process.env.PROJECT_ENV === 'production' ? 'None' : 'Lax'
        })
        .status(result.code).json(response(result.code, user))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }
}
