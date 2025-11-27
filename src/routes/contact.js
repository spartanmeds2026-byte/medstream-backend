import { Router } from 'express'
import { ContactController } from '../controllers/ContactController.js'

export const createContactRouter = ({ sendgridRepository, twilioRepository }) => {
  const contactRouter = Router()
  const contactController = new ContactController({ sendgridRepository, twilioRepository })

  contactRouter.post('/sendgrid', contactController.sendgridEmail)
  contactRouter.post('/twilio', contactController.twilioSms)

  return contactRouter
}
