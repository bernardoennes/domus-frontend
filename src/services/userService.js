import { readDatabase, readSessionUserId, updateDatabase } from '../lib/localDatabase.js'
import { createPasswordHash, verifyPassword } from '../lib/password.js'

export function maskCpf(cpf) {
  const digits = String(cpf ?? '').replace(/\D/g, '')

  if (digits.length < 4) {
    return digits
  }

  const first = digits.slice(0, 3)
  const last = digits.slice(-2)
  return `${first}.***.***-${last}`
}

export async function updatePassword({ currentPassword, newPassword }) {
  const userId = readSessionUserId()
  const user = readDatabase().users.find((item) => item.id === userId)

  if (!user) {
    throw new Error('Sua sessão expirou. Entre novamente para alterar a senha.')
  }

  if (!(await verifyPassword(currentPassword ?? '', user.password))) {
    throw new Error('Senha atual incorreta. Verifique e tente novamente.')
  }

  const password = await createPasswordHash(newPassword)

  updateDatabase((database) => {
    database.users.find((item) => item.id === user.id).password = password
  })
}

export function buildUserProfile(user, membership) {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    cpf: user.cpf_masked?.replace(/x/gi, '*') ?? maskCpf(user.cpf),
    access_type: membership?.access_type ?? 'Não definido',
    organisation_id: membership?.organisation_id ?? null,
  }
}
