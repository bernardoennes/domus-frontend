import { readDatabase, updateDatabase } from '../lib/localDatabase.js'
import { addMember, listMembers, removeMember } from './memberService.js'

const ACCESS_TYPE = 'CONDOMINO'

export async function fetchResidents(organisationId) {
  if (!organisationId) {
    return []
  }

  const database = readDatabase()

  return listMembers(database, organisationId, ACCESS_TYPE).map(({ membership, user, cpfMasked }) => {
    const details = database.residents.find((item) => item.organisation_user_id === membership.id)

    return {
      id: membership.id,
      userId: user.id,
      name: user.name,
      cpfMasked,
      block: details?.block ?? '',
      unit_number: details?.unit_number ?? null,
    }
  })
}

export async function provisionCondomino({ name, cpf, organisationId, block, unitNumber }) {
  const residentBlock = String(block ?? '').trim()

  if (!residentBlock) {
    throw new Error('Informe o bloco.')
  }

  if (!Number.isSafeInteger(Number(unitNumber)) || Number(unitNumber) < 1) {
    throw new Error('Informe um número de unidade válido.')
  }

  return updateDatabase((database) => {
    const membership = addMember(database, { name, cpf, organisationId, accessType: ACCESS_TYPE })

    database.residents.push({
      organisation_user_id: membership.id,
      block: residentBlock,
      unit_number: Number(unitNumber),
    })

    return { success: true }
  })
}

export async function updateResidentDetails({ membershipId, block, unitNumber }) {
  updateDatabase((database) => {
    const details = database.residents.find((item) => item.organisation_user_id === membershipId)

    if (!details) {
      throw new Error('Este morador não foi encontrado.')
    }

    details.block = block
    details.unit_number = unitNumber
  })
}

export async function removeCondomino({ organisationId, userId }) {
  return updateDatabase((database) => {
    const membership = removeMember(database, { organisationId, userId, accessType: ACCESS_TYPE })
    database.residents = database.residents.filter((item) => item.organisation_user_id !== membership.id)

    return { success: true }
  })
}
