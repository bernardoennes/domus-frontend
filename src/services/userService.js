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

export async function updateOwnName(name) {
  const normalizedName = String(name ?? '').trim()
  if (!normalizedName) {
    throw new Error('Informe o nome completo.')
  }
  const userId = readSessionUserId()
  if (userId == null) {
    throw new Error('Sua sessão expirou. Entre novamente para alterar o nome.')
  }

  return updateDatabase((database) => {
    const user = database.users.find((item) => item.id === userId)
    if (!user || !database.memberships.some((item) => item.user_id === userId)) {
      throw new Error('Sua sessão expirou. Entre novamente para alterar o nome.')
    }

    user.name = normalizedName
    for (const announcement of database.announcements) {
      if (announcement.author?.id != null && String(announcement.author.id) === String(userId)) {
        announcement.author.name = normalizedName
      }
      for (const comment of announcement.comments) {
        if (comment.author?.id != null && String(comment.author.id) === String(userId)) {
          comment.author.name = normalizedName
        }
      }
    }
    for (const ticket of database.tickets) {
      if (ticket.creator_id != null && String(ticket.creator_id) === String(userId)) {
        ticket.creator_name = normalizedName
      }
    }
    return normalizedName
  })
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
