import { validationSendgrid } from '../validations/Sendgrid/sendEmail.js'
import { validationTwilio } from '../validations/Twilio/twilioSms.js'
import { getLoggerForRoute } from '../utils/logger.js'
import { response } from '../utils/response.js'

export class ContactController {
  constructor ({ sendgridRepository, twilioRepository }) {
    this.sendgridRepository = new sendgridRepository()
    this.twilioRepository = new twilioRepository()
    this.logger = getLoggerForRoute('contact')
  }

  sendgridEmail = async (req, res) => {
    try {
      const validation = await validationSendgrid(req.body)
      if (!validation.success) { return res.status(400).json(validation) }

      const { to, from, subject, text, html } = req.body
      const response = await this.sendgridRepository.sendEmail({ to, from, subject, text, html })

      return res.status(200).json(response(200, response))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  twilioSms = async (req, res) => {
    try {
      const validation = await validationTwilio(req.body)
      if (!validation.success) { return res.status(400).json(validation) }

      const { to, body } = req.body
      const response = await this.twilioRepository.sendSms({ to, body })

      return res.status(200).json(response(200, response))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }
}
