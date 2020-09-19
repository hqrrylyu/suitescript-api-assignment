const assert = require('assert').strict
const debug = require('debug')('myapi:api')
const { zip } = require('./utils')

const lookupFieldDebug = debug.extend('lookupField')
const submitFieldDebug = debug.extend('submitField')

module.exports = class API {
  constructor (db) {
    this.db = db
  }

  async lookupField (type, id, fields) {
    const _fields = []
    if (typeof fields === 'string') {
      _fields.push({ rel: type, field: fields })
    } else {
      for (const field of fields) {
        if (!field.includes('.')) {
          _fields.push({ rel: type, field })
          continue
        }

        const [relFk, fkField] = field.split('.')
        const fkTable = await this._getFkTableName(type, relFk)
        _fields.push({ rel: type, relFk, fkTable, fkField })
      }
    }

    const sqlFields = _fields.map(field => {
      if (field.field) {
        return `"${field.rel}"."${field.field}"`
      } else {
        return `"${field.fkTable}"."${field.fkField}" AS "${field.relFk}.${field.fkField}"`
      }
    })

    let sqlJoins = _fields.map((field, i, array) => {
      if (field.field) return null
      return `INNER JOIN "${
        field.fkTable
      }" ON "${field.rel}"."${field.relFk}" = "${field.fkTable}"."id"`
    }).filter(value => value !== null)
    sqlJoins = Array.from(new Set(sqlJoins))

    const sql = `SELECT ${
      sqlFields.join(', ')
    } FROM "${type}" ${sqlJoins.join(' ')} WHERE "${type}"."id" = ${id};`
    lookupFieldDebug(sql)

    const result = await this.db.query(sql)
    return result.rows.length ? result.rows[0] : null
  }

  async submitField (type, id, fields, values) {
    let _fields = []
    let _values = []
    if (typeof fields === 'string' && !(values instanceof Array)) {
      _fields = [fields]
      _values = [values]
    } else if (fields instanceof Array) {
      if (!(values instanceof Array)) {
        throw new Error('values must be an array if fields is an array.')
      }
      if (fields.length !== values.length) {
        throw new Error('fields and values arrays must have the same length.')
      }

      _fields = fields
      _values = values
    } else throw new Error('invalid input data.')

    const sqlSetUpdates = Array.from(zip(_fields, _values))
      .map(([field, value]) => `"${field}" = '${value}'`)
    const sqlReturnFields = _fields.map(field => `"${field}"`)

    const sql = `UPDATE "${type}" SET ${
      sqlSetUpdates.join(', ')
    } WHERE "${type}"."id" = ${id} RETURNING ${sqlReturnFields.join(', ')};`
    submitFieldDebug(sql)

    const result = await this.db.query(sql)
    return result.rows[0]
  }

  async _getFkTableName (rel, relFk) {
    const result = await this.db.query(`
      SELECT confrelid::regclass::text AS referenced_rel
      FROM   pg_constraint
      WHERE  contype = 'f'
      AND    conrelid = '${rel}'::regclass -- relation name
      AND    conname = '${rel}_${relFk}_fkey' -- restrict to given FK
    `)
    assert.notStrictEqual(result.rows.length, 0)
    return result.rows[0].referenced_rel
  }
}
