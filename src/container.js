import AddressRepository from './repositories/AddressRepository.js'
import CategoryRepository from './repositories/CategoryRepository.js'
import ClientRepository from './repositories/ClientRepository.js'
import CompanyRepository from './repositories/CompanyRepository.js'
import OdooRepository from './repositories/OdooRepository.js'
import OrderRepository from './repositories/OrderRepository.js'
import ProductRepository from './repositories/ProductRepository.js'
import RoleRepository from './repositories/RoleRepository.js'
import SalesRepRepository from './repositories/SalesRepRepository.js'
import { SendgridRepository } from './repositories/SendgridRepository.js'
import { StytchRepository } from './repositories/StytchRepository.js'
import { UserRepository } from './repositories/UserRepository.js'
import UserRoleRepository from './repositories/UserRoleRepository.js'
import AddressService from './services/AddressService.js'
import AuthService from './services/AuthService.js'
import CategoryService from './services/categoryService.js'
import OrderService from './services/OrderService.js'
import ProductService from './services/ProductService.js'

const orderService = new OrderService({
  orderRepository: OrderRepository,
  clientRepository: ClientRepository,
  productRepository: ProductRepository,
  odooRepository: OdooRepository,
  sendgridRepository: SendgridRepository
})

const authService = new AuthService({
  stytchRepository: StytchRepository,
  userRepository: UserRepository,
  roleRepository: RoleRepository,
  companyRepository: CompanyRepository,
  salesRepRepository: SalesRepRepository,
  clientRepository: ClientRepository,
  userRoleRepository: UserRoleRepository
})

const addressService = new AddressService({
  clientRepository: ClientRepository,
  addressRepository: AddressRepository
})

const productService = new ProductService({
  odooRepository: OdooRepository,
  clientRepository: ClientRepository,
  productRepository: ProductRepository
})

const categoryService = new CategoryService({
  categoryRepository: CategoryRepository
})

const container = {
  orderService,
  authService,
  addressService,
  productService,
  categoryService
}

export default container
