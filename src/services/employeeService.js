import { readDatabase, updateDatabase } from '../lib/localDatabase.js'
import { addMember, assertMember, listMembers, removeMember } from './memberService.js'

const ACCESS_TYPE = 'FUNCIONARIO'

export async function fetchEmployees(organisationId) {
  if (!organisationId) {
    return []
  }

  const database = readDatabase()

  return listMembers(database, organisationId, ACCESS_TYPE).map(({ membership, user, cpfMasked }) => {
    const details = database.employees.find((item) => item.organisation_user_id === membership.id)

    return {
      id: membership.id,
      userId: user.id,
      name: user.name,
      cpfMasked,
      cargoCode: details?.cargo_code ?? null,
    }
  })
}

export async function provisionFuncionario({ name, cpf, organisationId, cargoCode }) {
  return updateDatabase((database) => {
    const membership = addMember(database, { name, cpf, organisationId, accessType: ACCESS_TYPE })

    database.employees.push({
      organisation_user_id: membership.id,
      cargo_code: cargoCode || null,
    })

    return { success: true }
  })
}

export async function updateEmployeeDetails({ organisationId, membershipId, cargoCode }) {
  updateDatabase((database) => {
    const details = database.employees.find((item) => String(item.organisation_user_id) === String(membershipId))

    if (!details) {
      throw new Error('Este funcionário não foi encontrado.')
    }

    assertMember(database, { organisationId, membershipId, accessType: ACCESS_TYPE })
    details.cargo_code = cargoCode || null
  })
}

export async function removeFuncionario({ organisationId, userId }) {
  return updateDatabase((database) => {
    const membership = removeMember(database, { organisationId, userId, accessType: ACCESS_TYPE })
    database.employees = database.employees.filter((item) => item.organisation_user_id !== membership.id)

    return { success: true }
  })
}
