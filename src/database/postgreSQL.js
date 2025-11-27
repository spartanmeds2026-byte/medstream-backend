import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

export const query = async (sql, values) => {
  console.log(`sql: ${sql}, values: ${values}`);
  const result = await pool.query(sql, values)

  return result
}