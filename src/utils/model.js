import { query } from '../database/postgreSQL.js'

export class Model {
  table = null
  primaryKey = 'id'
  createdField = 'created_at'
  updatedField = 'updated_at'
  timestamps = true
  selectable = null
  strictSelect = false

  async find (pkValue) {
    let queryStr = `SELECT * FROM ${this.table} WHERE ${this.primaryKey} = ${pkValue}`
    if (this.strictSelect) {
      queryStr = `SELECT ${this.selectable.join(', ')} FROM ${this.table} WHERE ${this.primaryKey} = $1`
    }

    const { rows: result } = await query(queryStr, [pkValue])

    if (result.length === 0) {
      return null
    }

    return result[0]
  }

  async get (where = null, select = ['*'], limit = null, skip = null) {
    if (this.strictSelect && select.includes('*')) {
      select = select.filter((key) => this.selectable.includes(key))
    }

    let sqlQuery = `SELECT ${select.join(', ')} FROM ${this.table}`

    if (where !== null) {
      sqlQuery += ` WHERE ${where}`
    }

    if (limit !== null) {
      sqlQuery += ` LIMIT ${limit}`
    }

    if (skip !== null) {
      sqlQuery += ` OFFSET ${skip}`
    }

    const { rows: results } = await query(sqlQuery)

    return results
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);

    const queryStr = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${keys.map((key, index) => `$${index + 1}`).join(', ')}) RETURNING *`;

    const { rows: results } = await query(queryStr, values);
    if (this.strictSelect) {
      return results.map((result) => this.selectable.reduce((acc, key) => ({ ...acc, [key]: result[key] }), {}));
    }
    
    return results[0];
  }

  async update(pkValue, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);

    const set = keys.map((key, index) => `${key} = $${index + 1}`);

    const queryStr = `UPDATE ${this.table} SET ${set.join(', ')} WHERE ${this.primaryKey} = $${keys.length + 1} RETURNING *`;

    const { rows: results } = await query(queryStr, [...values, pkValue]);

    if (this.strictSelect) {
      return results.map((result) => this.selectable.reduce((acc, key) => ({ ...acc, [key]: result[key] }), {}));
    }

    return results[0];
  }

  async delete (pkValue) {
    const queryStr = `DELETE FROM ${this.table} WHERE ${this.primaryKey} = ?`

    query(queryStr, [pkValue])

    return true
  }
}
