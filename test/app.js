import { createApp } from '../app.js'
import { BlobRepository } from '../src/repositories/BlobRepository.js'
import { StytchRepository } from '../src/repositories/StytchRepository.js'
import { UserRepository } from '../src/repositories/UserRepository.js'
import { TwilioRepository } from '../src/repositories/TwilioRepository.js'
import { SendgridRepository } from '../src/repositories/SendgridRepository.js'

const { app, server } = createApp({
  stytchRepository: StytchRepository,
  userRepository: UserRepository,
  storageRepository: BlobRepository,
  twilioRepository: TwilioRepository,
  sendgridRepository: SendgridRepository
})

export { app, server }
