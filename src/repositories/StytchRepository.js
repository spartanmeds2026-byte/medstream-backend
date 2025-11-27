export class StytchRepository {
  projectId
  secretKey
  callbackUrl
  baseUrl = 'https://api.stytch.com/v1'
  constructor () {
    this.projectId = process.env.STYTCH_PROJECT_ID
    this.secretKey = process.env.STYTCH_SECRET_KEY
    this.spartanUrl = process.env.STYTCH_CALLBACK_SPARTAN_URL
    this.callbackUrl = process.env.STYTCH_CALLBACK_URL
  }

  async logUp (email) {
    const body = {
      email
    }

    const url = `${this.baseUrl}/users`
    const response = await this.request(url, body)

    return response
  }

  async login (email, hostname) {
    let body = {}
    if (hostname == 'https://portal.spartanmeds.com') {
      body = {
        email,
        login_magic_link_url: this.spartanUrl
      }
    } else {
      body = {
        email,
        login_magic_link_url: this.callbackUrl
      }
    }

    const url = `${this.baseUrl}/magic_links/email/send`
    const response = await this.request(url, body)

    return response
  }

  async smsLogin (phoneNumber) {
    const body = {
      phone_number: phoneNumber
    }

    const url = `${this.baseUrl}/otps/sms/login_or_create`
    const response = await this.request(url, body)

    return response
  }

  async authToken (token) {
    const body = {
      token
    }

    const url = `${this.baseUrl}/magic_links/authenticate`
    const response = await this.request(url, body)

    return response
  }

  async oauthToken (token) {
    const body = {
      token
    }

    const url = `${this.baseUrl}/oauth/authenticate`
    const response = await this.request(url, body)

    return response
  }

  async smsAuthCode (code, phoneId) {
    const body = {
      code,
      phone_id: phoneId
    }

    const url = `${this.baseUrl}/otps/authenticate`
    const response = await this.request(url, body)

    return response
  }

  async request (url, body) {
    const basicToken = Buffer.from(`${this.projectId}:${this.secretKey}`).toString('base64')

    // fetch port
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return data
  }
}
