import { createToken } from '../utils/JWToken.js'
import { response } from '../utils/response.js'

export default class AuthService {
  constructor({ stytchRepository, userRepository, roleRepository, companyRepository, salesRepRepository, clientRepository, userRoleRepository }) {
    this.stytchRepository = new stytchRepository()
    this.userRepository = userRepository
    this.roleRepository = roleRepository
    this.companyRepository = companyRepository
    this.salesRepRepository = salesRepRepository
    this.clientRepository = clientRepository
    this.userRoleRepository = userRoleRepository
  }

  login = async (email, hostname) => {
    if (process.env.AUTH_MODE == 'stytch') {
      const user = await this.userRepository.getByEmail(email)
      if (!user?.id) { return response(404, 'User not found') }

      let login = await this.stytchRepository.login(email, hostname)

      if (login.status_code != 200 && login.status_code != 404) {
        console.log(login)
        return {
          code: 503,
          data: 'Service unavailable'
        }
      }

      if (login.status_code == 404) {
        await this.stytchRepository.logUp(email)
        login = await this.stytchRepository.login(email, hostname)
      }

      return response(200, login)
    }

    return response(503, 'Not implemented')
  }

  smsLogin = async (phone) => {
    const user = await this.userRepository.getByPhone(phone)
    if (!user) {
      return response(404, 'User not found')
    }

    const login = await this.stytchRepository.smsLogin(phone)

    if (login.status_code !== 200) { return response(400, login.error_message) }

    return response(200, login)
  }

  smsLoginVerify = async (code, method_id) => {
    const _code = code.replace(/\D/g, '')

    const authStytch = await this.stytchRepository.smsAuthCode(_code, method_id)

    if (authStytch.status_code === 401) { return response(401, 'Unauthorized') }

    if (authStytch.status_code !== 200) { return response(400, authStytch.error_message) }

    if (authStytch.user.phone_numbers[0].phone_number === null) { return response(401, 'Unauthorized') }

    const user = await this.userRepository.getByPhone(authStytch.user.phone_numbers[0].phone_number)

    if (user === null) { return response(401, 'Unauthorized') }

    const payload = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email
    }

    const getToken = createToken(payload)

    const userPayload = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      picture: user.picture,
      role: user.role,
      external_token: getToken
    }

    const accessToken = createToken(userPayload)

    return response(200, {
      access_token: accessToken,
      user: userPayload
    })
  }

  passwordLogin = async (email, password) => {
    if (!password || !email) {
      return response(400, 'Bad request')
    }

    const user = await this.userRepository.getByEmail(email)
    if (!user) {
      return response(404, 'User not found')
    }

    const isPasswordValid = await this.userRepository.verifyPassword(user, password)
    if (!isPasswordValid) {
      return response(400, 'Invalid credentials')
    }

    let company
    if (user.company_id) {
      company = await this.companyRepository.get(user.company_id)
    }

    const roles = await this.roleRepository.getUserRoles(user.id)

    let salesRep
    if (user.sales_rep_object) {
      salesRep = await this.salesRepRepository.getByOdooId(user.sales_rep_object[0])
    }

    const client = await this.clientRepository.getByUserId(user.id)

    // Check if user has admin role (id 1)
    const adminRole = await this.userRoleRepository.getPermissionsByUserId(user.id)
    const isAdmin = adminRole?.some(userRole => userRole.role_id === 1) || false

    const payload = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      company,
      rep: user.sales_rep_object ?? undefined,
      term: user.payment_terms_object,
      salesRep,
      free_shipping_minimun: client?.odoo?.x_studio_free_shipping_minimum
    }

    const getToken = createToken(payload)

    const userPayload = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      picture: user.picture,
      role: roles.length > 0 ? roles[0].roles : undefined,
      external_token: getToken,
      company,
      rep: user.sales_rep_object ?? undefined,
      term: user.payment_terms_object,
      salesRep,
      free_shipping_minimun: client?.odoo?.x_studio_free_shipping_minimum,
      is_admin: isAdmin
    }

    const accessToken = createToken(userPayload)

    return response(200, {
      access_token: accessToken,
      user: userPayload
    })
  }

  callback = async (stytch_token_type, token) => {
    let authStytch = null
    if (stytch_token_type == 'oauth') {
      authStytch = await this.stytchRepository.oauthToken(token)
    } else {
      authStytch = await this.stytchRepository.authToken(token)
    }

    if (authStytch.status_code == 401) { return response(401, 'Unauthorized') }

    if (authStytch.user.emails[0].email === null) { return response(401, 'Unauthorized') }

    const user = await this.userRepository.getByEmail(authStytch.user.emails[0].email)

    if (user === null) { return response(401, 'Unauthorized') }

    const roles = await this.roleRepository.getUserRoles(user.id)

    let company
    if (user.company_id) {
      company = await this.companyRepository.get(user.company_id)
    }

    let salesRep
    if (user.sales_rep_object) {
      salesRep = await this.salesRepRepository.getByOdooId(user.sales_rep_object[0])
    }
    const client = await this.clientRepository.getByUserId(user.id)

    const payload = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      company,
      rep: user.sales_rep_object ?? undefined,
      term: user.payment_terms_object,
      salesRep,
      free_shipping_minimun: client?.odoo?.x_studio_free_shipping_minimum
    }

    const getToken = createToken(payload)

    const userPayload = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      picture: user.picture,
      role: roles.length > 0 ? roles[0].roles : undefined,
      external_token: getToken,
      company,
      rep: user.sales_rep_object ?? undefined,
      term: user.payment_terms_object,
      salesRep,
      free_shipping_minimun: client?.odoo?.x_studio_free_shipping_minimum
    }

    const accessToken = createToken(userPayload)

    return response(200, {
      access_token: accessToken,
      user: userPayload
    })
  }

  simulateLogin = async (userId, adminId) => {
    const user = await this.userRepository.get(userId)
    if (!user) {
      return response(404, 'User not found')
    }

    let salesRep
    if (user.sales_rep_object) {
      salesRep = await this.salesRepRepository.getByOdooId(user.sales_rep_object[0])
    }

    const roles = await this.roleRepository.getUserRoles(user.id)

    const client = await this.clientRepository.getByUserId(user.id)

    const payload = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      rep: user.sales_rep_object ?? undefined,
      term: user.payment_terms_object,
      salesRep,
      free_shipping_minimun: client?.odoo?.x_studio_free_shipping_minimum
    }

    const getToken = createToken(payload)

    const userPayload = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      picture: user.picture,
      role: roles.length > 0 ? roles[0].roles : undefined,
      external_token: getToken,
      simulated: true,
      admin_id: parseInt(adminId),
      rep: user.sales_rep_object ?? undefined,
      term: user.payment_terms_object,
      salesRep,
      free_shipping_minimun: client?.odoo?.x_studio_free_shipping_minimum
    }

    const accessToken = createToken(userPayload)

    return response(200, {
      access_token: accessToken,
      user: userPayload
    })
  }

  exitSimulateLogin = async (userId) => {
    const user = await this.userRepository.get(userId)
    if (!user) {
      return response(404, 'User not found')
    }

    const roles = await this.roleRepository.getUserRoles(user.id)

    let salesRep
    if (user.sales_rep_object) {
      salesRep = await this.salesRepRepository.getByOdooId(user.sales_rep_object[0])
    }

    const client = await this.clientRepository.getByUserId(user.id)

    const payload = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      rep: user.sales_rep_object ?? undefined,
      term: user.payment_terms_object,
      salesRep,
      free_shipping_minimun: client?.odoo?.x_studio_free_shipping_minimum
    }

    const getToken = createToken(payload)

    const userPayload = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      picture: user.picture,
      role: roles.length > 0 ? roles[0].roles : undefined,
      external_token: getToken,
      rep: user.sales_rep_object ?? undefined,
      term: user.payment_terms_object,
      salesRep,
      free_shipping_minimun: client?.odoo?.x_studio_free_shipping_minimum
    }

    const accessToken = createToken(userPayload)

    return response(200, {
      access_token: accessToken,
      user: userPayload
    })
  }
}
