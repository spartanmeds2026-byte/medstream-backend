import { response } from '../utils/response.js'

export default class AddressService {
  constructor ({ addressRepository, clientRepository }) {
    this.addressRepository = addressRepository
    this.clientRepository = clientRepository
  }

  getByUser = async (userId) => {
    const client = await this.clientRepository.getByUserId(userId)
    if (!client) return response(404, 'Client not found')

    const addresses = await this.addressRepository.getAll(client.id)

    return response(200, addresses)
  }

  create = async (data, userId) => {
    const client = await this.clientRepository.getByUserId(userId)
    if (!client) return response(404, 'Client not found')

    const body = {
      first_name: data.first_name,
      last_name: data.last_name,
      address_1: data.address_1,
      address_2: data.address_2,
      city: data.city,
      state: data.state,
      zip: data.zip,
      country: data.country
    }

    const address = await this.addressRepository.create(client.id, body)
    console.log('Testing')
    return response(201, address)
  }
}
