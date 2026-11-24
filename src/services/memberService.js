import { getNextId } from '../lib/localDatabase.js'
import { isValidCpf, normalizeCpf } from '../utils/cpfValidation.js'
import { maskCpf } from './userService.js'

function findOrganisation(database, organisationId) {
  const organisation = database.organisations.find((item) => String(item.id) === String(organisationId))

  if (!organisation) {
    throw new Error('Não foi possível identificar o condomínio.')
  }

  return organisation
}

export function addMember(database, { name, cpf, organisationId, accessType }) {
  const organisation = findOrganisation(database, organisationId)
  const normalizedCpf = normalizeCpf(cpf)
  const normalizedName = String(name ?? '').trim()

  if (!normalizedName) {
    throw new Error('Informe o nome completo.')
  }

  if (!isValidCpf(normalizedCpf)) {
    throw new Error('Informe um CPF válido.')
  }

  let user = database.users.find((item) => item.cpf === normalizedCpf)

  if (user && database.memberships.some((item) => item.user_id === user.id)) {
    throw new Error('Este CPF já está vinculado a um condomínio.')
  }

  if (!user) {
    user = { id: getNextId(database, 'users'), name: normalizedName, cpf: normalizedCpf, password: null }
    database.users.push(user)
  }

  const membership = {
    id: getNextId(database, 'memberships'),
    user_id: user.id,
    organisation_id: organisation.id,
    access_type: accessType,
  }
  database.memberships.push(membership)

  return membership
}

export function assertMember(database, { organisationId, membershipId, accessType }) {
  const membership = database.memberships.find((item) => (
    String(item.id) === String(membershipId)
    && String(item.organisation_id) === String(organisationId)
    && item.access_type === accessType
  ))
  const user = membership && database.users.find((item) => String(item.id) === String(membership.user_id))

  if (!user) {
    throw new Error('Este vínculo não foi encontrado neste condomínio.')
  }

  return membership
}

export function removeMember(database, { organisationId, userId, accessType }) {
  const membership = database.memberships.find((item) => (
    String(item.organisation_id) === String(organisationId)
    && String(item.user_id) === String(userId)
    && item.access_type === accessType
  ))

  if (!membership) {
    throw new Error('Este vínculo não foi encontrado.')
  }

  database.memberships = database.memberships.filter((item) => item.id !== membership.id)

  return membership
}

export function listMembers(database, organisationId, accessType) {
  return database.memberships
    .filter((item) => (
      String(item.organisation_id) === String(organisationId) && item.access_type === accessType
    ))
    .map((membership) => {
      const user = database.users.find((item) => item.id === membership.user_id)

      if (!user) {
        throw new Error('Não foi possível carregar os dados dos usuários. Tente novamente.')
      }

      return {
        membership,
        user,
        cpfMasked: maskCpf(user.cpf),
      }
    })
}
