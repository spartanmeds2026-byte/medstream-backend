import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import winston from 'winston'
import chalk from 'chalk'

const logDirectory = join('/tmp/logs')

if (!existsSync(logDirectory)) {
  mkdirSync(logDirectory)
}

const getLogFilePath = (routeName, logLevel) => {
  const routeLogDirectory = join(logDirectory, routeName)

  if (!existsSync(routeLogDirectory)) {
    mkdirSync(routeLogDirectory)
  }
  return join(routeLogDirectory, `${logLevel}.log`)
}

const createLoggerInstance = (routeName) => {
  return winston.createLogger({
    levels: winston.config.syslog.levels,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ level, message, method, jwtToken, timestamp, stack, route, status, user, requestBody, queryParameters }) => {
        let logMessage = `${chalk.gray(timestamp)} [${level.toUpperCase()}] `
        if (method) logMessage += `${chalk.blue(`(${method})`)} `
        if (jwtToken) logMessage += `${chalk.yellow(`JWT: ${jwtToken}`)} `
        logMessage += `${message}`
        if (user) logMessage += ` User: ${user}`
        if (route) logMessage += ` Route: ${route}`
        if (status) logMessage += ` Status: ${status}`
        if (requestBody) logMessage += ` Request Body: ${JSON.stringify(requestBody)}`
        if (queryParameters) logMessage += ` Query Parameters: ${JSON.stringify(queryParameters)}`

        if (level === 'error' && stack) {
          logMessage += `\n${stack}`
        }

        return logMessage
      })
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message }) => {
            return `${chalk.gray(new Date().toISOString())} [${level.toUpperCase()}] ${message}`
          })
        )
      }),
      new winston.transports.File({ filename: join(logDirectory, 'combined.log') }),
      new winston.transports.File({ filename: getLogFilePath(routeName, 'error'), level: 'error', format: winston.format.json() }),
      new winston.transports.File({ filename: getLogFilePath(routeName, 'warn'), level: 'warn', format: winston.format.json() }),
      new winston.transports.File({ filename: getLogFilePath(routeName, 'http'), level: 'http', format: winston.format.json() }),
      new winston.transports.File({ filename: getLogFilePath(routeName, 'debug'), level: 'debug', format: winston.format.json() })
    ]
  })
}

export default createLoggerInstance

export const getLoggerForRoute = (routeName) => {
  const logger = createLoggerInstance(routeName)
  return logger
}
