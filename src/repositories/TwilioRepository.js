import twilio from 'twilio'

export class TwilioRepository {
  construct () {
    this.apikey = process.env.TWILIO_API_KEY
    this.apiSecret = process.env.TWILIO_API_SECRET
    this.accountSid = process.env.TWILIO_ACCOUNT_SID
  }

  async sendSms ({ to, body }) {
    const client = twilio(this.accountSid, this.apiSecret)
    const response = await client.messages.create({
      body,
      to,
      from: '+19048220125'
    })
    return response
  }
}
