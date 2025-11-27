import { Router } from 'express'

export const dashboardRouter = Router()

dashboardRouter.get('/', function (req, res) {
  return res.json({ hello: 'world' })
})

dashboardRouter.get('/ping', function (req, res) {
  return res.json({ ping: 'pong' })
})
