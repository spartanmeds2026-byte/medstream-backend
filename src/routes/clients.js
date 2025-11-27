import { Router } from 'express'
import { verifyAuth } from '../middlewares/auth.js'
import { ClientController } from '../controllers/ClientController.js'
import { getPermissions } from '../middlewares/permissions.js'

export const createClientRouter = ({ clientRepository, caregiverRepository, sendgridRepository, salesRepRepository, paymentTermRepository }) => {
  const router = Router()
  router.use(verifyAuth)
  const clientController = new ClientController({ clientRepository, caregiverRepository, sendgridRepository, salesRepRepository, paymentTermRepository })

  router.use(getPermissions('contacts'))
  router.get('/', clientController.index.bind(clientController))
  router.post('/', clientController.store.bind(clientController))
  router.get('/:id', clientController.show.bind(clientController))
  router.put('/:id', clientController.update.bind(clientController))
  router.delete('/:id', clientController.destroy.bind(clientController))
  router.get('/:id/invite', clientController.invite.bind(clientController))

  router.get('/terms/list', clientController.terms.bind(clientController))
  router.get('/reps/list', clientController.reps.bind(clientController))
  router.get('/unassigned/list', clientController.unassigned.bind(clientController))
  router.get('/user/:userId', clientController.getClientByUserId.bind(clientController))

  return router
}
