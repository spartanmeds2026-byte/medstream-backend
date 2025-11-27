import { createApp } from './app.js'
import { BlobRepository } from './src/repositories/BlobRepository.js'
import { SendgridRepository } from './src/repositories/SendgridRepository.js'
import { StytchRepository } from './src/repositories/StytchRepository.js'
import { TwilioRepository } from './src/repositories/TwilioRepository.js'
import { UserRepository } from './src/repositories/UserRepository.js'
import UserRoleRepository from './src/repositories/UserRoleRepository.js'
import RoleRepository from './src/repositories/RoleRepository.js'
import ModuleRepository from './src/repositories/ModuleRepository.js'
import PermissionRepository from './src/repositories/PermissionRepository.js'
import ProductRepository from './src/repositories/ProductRepository.js'
import ClientRepository from './src/repositories/ClientRepository.js'
import OrderRepository from './src/repositories/OrderRepository.js'
import OdooRepository from './src/repositories/OdooRepository.js'
import SalesRepRepository from './src/repositories/SalesRepRepository.js'
import PaymentTermRepository from './src/repositories/PaymentTermRepository.js'
import CategoryRepository from './src/repositories/CategoryRepository.js'

createApp({
  stytchRepository: StytchRepository,
  userRepository: UserRepository,
  storageRepository: BlobRepository,
  sendgridRepository: SendgridRepository,
  twilioRepository: TwilioRepository,
  userRoleRepository: UserRoleRepository,
  roleRepository: RoleRepository,
  moduleRepository: ModuleRepository,
  permissionRepository: PermissionRepository,
  productRepository: ProductRepository,
  clientRepository: ClientRepository,
  orderRepository: OrderRepository,
  odooRepository: OdooRepository,
  salesRepRepository: SalesRepRepository,
  paymentTermRepository: PaymentTermRepository,
  categoryRepository: CategoryRepository
})
