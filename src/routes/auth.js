import { Router } from 'express'
import { AuthController } from '../controllers/AuthController.js'
import { getPermissions } from '../middlewares/permissions.js'
import { verifyAuth } from '../middlewares/auth.js'

export const createAuthRouter = ({ authService }) => {
  const authRouter = Router()

  const authController = new AuthController({ authService })

  authRouter.post('/login', authController.login)
  authRouter.post('/login/password', authController.passwordLogin)
  authRouter.get('/stytch/callback', authController.callback)
  authRouter.post('/stytch/sms', authController.smsLogin)
  authRouter.post('/stytch/sms/verify', authController.smsLoginVerify)
  authRouter.post('/logout', authController.logout)

  authRouter.post('/login/simulate',
    verifyAuth,
    getPermissions('login_simulations'),
    authController.simulate.bind(authController)
  )
  authRouter.post('/login/simulate/exit',
    verifyAuth,
    authController.exitSimulation.bind(authController)
  )
  return authRouter
}
