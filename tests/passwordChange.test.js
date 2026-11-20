import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import { test } from 'node:test'
import { createPasswordHash, verifyPassword } from '../src/lib/password.js'
import { updatePassword } from '../src/services/userService.js'
import { getPasswordValidation } from '../src/utils/passwordValidation.js'

test('password requirements cover length, number and special character', () => {
  const invalidKeys = (password) => getPasswordValidation(password)
    .filter((rule) => !rule.isValid)
    .map((rule) => rule.key)

  assert.deepEqual(invalidKeys('Abc1!'), ['length'])
  assert.deepEqual(invalidKeys('abcdefgh!'), ['number'])
  assert.deepEqual(invalidKeys('abcdefgh1'), ['special'])
  assert.deepEqual(invalidKeys(`${'a'.repeat(127)}1!`), ['maximum'])
  assert.deepEqual(invalidKeys(`${'a'.repeat(126)}1!`), [])
  assert.deepEqual(invalidKeys('abcdef1!'), [])
})

test('rejects an incorrect current password without changing the saved password', async () => {
  const storage = new Map()
  globalThis.window = {
    crypto: webcrypto,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  }

  try {
    const originalPassword = await createPasswordHash('atual123!')
    const database = {
      version: 1,
      users: [{ id: 1, password: originalPassword }],
      organisations: [],
      memberships: [],
      residents: [],
      employees: [],
      areas: [],
      reservations: [],
    }
    storage.set('condominio:database', JSON.stringify(database))
    storage.set('condominio:session', JSON.stringify({ userId: 1 }))

    await assert.rejects(
      updatePassword({ currentPassword: 'incorreta', newPassword: 'nova1234!' }),
      /Senha atual incorreta/,
    )
    assert.deepEqual(JSON.parse(storage.get('condominio:database')).users[0].password, originalPassword)

    await updatePassword({ currentPassword: 'atual123!', newPassword: 'nova1234!' })
    const savedPassword = JSON.parse(storage.get('condominio:database')).users[0].password
    assert.equal(await verifyPassword('nova1234!', savedPassword), true)
    assert.equal(await verifyPassword('atual123!', savedPassword), false)
  } finally {
    delete globalThis.window
  }
})
