const fs = require('fs')
const path = require('path')
const assert = require('assert').strict
const { Client } = require('pg')
const API = require('./api')

const INIT_SQL = fs.readFileSync(path.join(__dirname, 'init.sql'), { encoding: 'utf-8' })

async function initDB (client) {
  await client.query(INIT_SQL)
}

;(async () => {
  const connectionString = process.env.CONNECTION_STRING
  const client = new Client(connectionString)
  await client.connect()

  await initDB(client)
  const api = new API(client)

  let result
  result = await api.lookupField('countries', 2, 'name')
  assert.deepStrictEqual(result, { name: 'United States of America' })

  result = await api.lookupField('users', 1, [
    'id', 'username', 'email', 'job.title', 'citizenship.name', 'citizenship.code'
  ])
  assert.deepStrictEqual(result, {
    id: 1,
    username: 'wizard',
    email: 'wizard@email.com',
    'job.title': 'programmer',
    'citizenship.name': 'Ukraine',
    'citizenship.code': 'UA'
  })

  result = await api.submitField('users', 1, ['username', 'job'], ['wiz', 2])
  assert.deepStrictEqual(result, { username: 'wiz', job: 2 })

  await initDB(client)
  result = await api.submitField('jobs', 2, 'title', 'seller')
  assert.deepStrictEqual(result, { title: 'seller' })

  await client.end()
})()
