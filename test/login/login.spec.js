import request from 'supertest'
import { prismaMock } from '../../singleton.ts'
import { app, server } from '../app.js'
import { findFirst, findFirstNull } from '../mocks/users/findFirst.js'

const supertest = request(app)

describe('Auth Endpoints', () => {
  test('Should return 200: Ok - login a user', async () => {
    findFirst()
    const response = await supertest
      .post('/auth/login/password')
      .send({
        email: 'ysmael@s9-consulting.com',
        password: '123459nA.'
      })
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('code')
    expect(response.body.code).toBe(200)
    expect(response.body).toHaveProperty('data')
    expect(response.body.data).toHaveProperty('id')
    expect(response.headers['set-cookie']).toBeTruthy()
  }, 30000)

  test('Should return 404: Not Found - user send incomplete data', async () => {
    const response = await supertest
      .post('/auth/login/password')
      .send({
        email: 'ysmael@s9-consulting.com'
      })
    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('code')
    expect(response.body.code).toBe(400)
    expect(response.body).toHaveProperty('data')
  })

  test('Should return 400: Bad Request - invalid credentials', async () => {
    findFirst()
    const response = await supertest
      .post('/auth/login/password')
      .send({
        email: 'ysmael@s9-consulting.com',
        password: '12345678'
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('code')
    expect(response.body.code).toBe(400)
    expect(response.body).toHaveProperty('data')
    expect(response.body.data).toBe('Invalid credentials')
  })
  // 25,20,42,26

  test('Should return 404: Not Found - user not found', async () => {
    findFirstNull()
    const response = await supertest
      .post('/auth/login/password')
      .send({
        email: 'ysmael@s9-consulting.com',
        password: '123459nA.'
      })

    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty('code')
    expect(response.body.code).toBe(404)
    expect(response.body).toHaveProperty('data')
    expect(response.body.data).toBe('User not found')
  })

  afterAll(() => {
    server.close()
  })
})
