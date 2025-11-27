import sgMail from '@sendgrid/mail'
import 'dotenv/config'

export class SendgridRepository {
  constructor(apiKey = process.env.SENDGRID_API_KEY) {
    this.apiKey = apiKey
    sgMail.setApiKey(this.apiKey)
  }

  async sendEmail({ to, from, subject, text: message, template, body }) {
    try {
      const msg = {
        to,
        from,
        subject
      }

      if (template) {
        msg.templateId = template
        msg.dynamicTemplateData = body
      } else {
        msg.text = message
      }

      const response = await sgMail.send(msg)
      return response
    } catch (error) {
      console.error('Error sending email:', error.response ? error.response.body : error)
      throw new Error('Error sending email.')
    }
  }
}
