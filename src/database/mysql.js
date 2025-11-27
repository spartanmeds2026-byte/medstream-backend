import mysql from 'mysql2/promise'
import 'dotenv/config'

const _config = {
  host: process.env.DB_HOST ?? 'localhost',
  user: process.env.DB_USERNAME ?? 'root',
  port: process.env.DB_PORT ?? 3306,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

const connection = await mysql.createPool(_config)

export const query = async (sql, values) => {
  const result = await connection.execute(sql, values)

  return result
}
