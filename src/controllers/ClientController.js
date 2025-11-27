import { getLoggerForRoute } from '../utils/logger.js'
import getRelations from '../utils/relations.js'
import { response } from '../utils/response.js'
import { validationClientCreate } from '../validations/clients/create.js'

export class ClientController {
  constructor({ clientRepository, caregiverRepository, sendgridRepository, userRepository, salesRepRepository, paymentTermRepository }) {
    this.clientRepository = clientRepository
    this.caregiverRepository = caregiverRepository
    this.sendgridRepository = new sendgridRepository()
    this.salesRepRepository = salesRepRepository
    this.paymentTermRepository = paymentTermRepository
    this.userRepository = userRepository
    this.logger = getLoggerForRoute('categories')
  }

  index = async (req, res) => {
    if (!req.permissions.list) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { page, limit, filters, sortField, sortOrder, relations } = req.query

      let _sortOrder = -1
      if (sortOrder) _sortOrder = parseInt(sortOrder)

      const results = await this.clientRepository.getAll({ page, limit, filters, sortField, sortOrder: _sortOrder }, req.auth_user.company.odoo_id ?? undefined)

      if (relations) {
        for (let i = 0; i < relations.length; i++) {
          const relation = relations[i]

          results.results = await getRelations(results.results, relation)
        }
      }

      return res.status(200).json(response(200, results))
    } catch (error) {
      this.logger.error(error.message + error.stack.split('\n')[1])
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  show = async (req, res) => {
    if (!req.permissions.read) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { id } = req.params
      const result = await this.clientRepository.get(id)
      if (!result) return res.status(404).json(response(404, 'Client not found'))

      return res.status(200).json(response(200, result))
    } catch (error) {
      this.logger.error(error.message + error.stack.split('\n')[1])
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  store = async (req, res) => {
    if (!req.permissions.create) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { data } = req.body
      if (!data) return res.status(400).json(response(400, 'Invalid request'))

      const caregiverSchema = await validationClientCreate(req.body.data)
      if (!caregiverSchema.success) return res.status(400).json(response(400, caregiverSchema.errors))

      const result = await this.clientRepository.create(data, req.auth_user.id)

      return res.status(201).json(response(201, result))
    } catch (error) {
      this.logger.error(error.message + error.stack.split('\n')[1])
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  update = async (req, res) => {
    if (!req.permissions.update) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { data } = req.body

      const caregiverSchema = await validationClientCreate(req.body.data)
      if (!caregiverSchema.success) return res.status(400).json(response(400, caregiverSchema.errors))

      const { id } = req.params
      const categoryExist = await this.clientRepository.get(id)
      if (!categoryExist) return res.status(404).json(response(404, 'Client not found'))

      const result = await this.clientRepository.update(id, data, req.auth_user.id)

      return res.status(200).json(response(200, result))
    } catch (error) {
      this.logger.error(error.message + error.stack.split('\n')[1])
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  destroy = async (req, res) => {
    if (!req.permissions.del) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { id } = req.params
      const clientExist = await this.clientRepository.get(id)
      if (!clientExist) return res.status(404).json(response(404, 'Client not found'))

      await this.clientRepository.delete(id)

      return res.status(200).json(response(200, 'Client deleted successfully'))
    } catch (error) {
      this.logger.error(error.message + error.stack.split('\n')[1])
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  invite = async (req, res) => {
    if (!req.permissions.read) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { id } = req.params
      const userId = parseInt(id)

      const client = await this.clientRepository.getByUserId(userId)
      if (!client) {
        return res.status(404).json(response(404, 'Client not found'))
      }

      if (!client.email) {
        return res.status(400).json(response(400, 'Client does not have an email address'))
      }

      const companyName = client.company_id === 1 ? 'Medstream' : 'Spartan'
      const inviteLink =
        client.company_id === 1
          ? 'https://portal.medstreamglobal.com?changePassword'
          : 'https://spartan.s9-cloud.com?changePassword'

      const template = 'd-d1f216510dca4821a6b7b558eeba404a'

      const emailData = {
        to: client.email,
        from: 'noreply@medstreamglobal.com',
        subject: 'Welcome to Our New Ordering Portal – Your Access is Ready!',
        template,
        body: {
          name: client.name,
          url: inviteLink,
          company: companyName
        }
      }

      await this.sendgridRepository.sendEmail(emailData)

      return res.status(200).json(response(200, 'Invitation sent successfully'))
    } catch (error) {
      this.logger.error(error.message + error.stack.split('\n')[1])
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  reps = async (req, res) => {
    if (!req.permissions.del) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const results = await this.salesRepRepository.getAll()

      const _results = results.map(item => {
        return {
          name: item.name,
          id: item.id
        }
      })

      return res.status(200).json(response(200, _results))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  terms = async (req, res) => {
    if (!req.permissions.del) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const results = await this.paymentTermRepository.getAll()

      const _results = results.map(item => {
        return {
          name: item.name,
          id: item.id
        }
      })

      return res.status(200).json(response(200, _results))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  unassigned = async (req, res) => {
    if (!req.permissions.list) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const companyId = req.auth_user.company.odoo_id
      if (!companyId) {
        return res.status(400).json(response(400, 'Company ID not found'))
      }

      const results = await this.clientRepository.getUnassignedClients(companyId)

      return res.status(200).json(response(200, results))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }

  getClientByUserId = async (req, res) => {
    if (!req.permissions.read) return res.status(403).json(response(403, 'Forbidden'))
    try {
      const { userId } = req.params

      if (!userId) {
        return res.status(400).json(response(400, 'User ID is required'))
      }

      const client = await this.clientRepository.getClientByUserId(userId)

      if (!client) {
        return res.status(404).json(response(404, 'No client found for this user'))
      }

      return res.status(200).json(response(200, client))
    } catch (error) {
      this.logger.error(error.message + error.stack)
      return res.status(500).json(response(500, 'Internal server error'))
    }
  }


}
