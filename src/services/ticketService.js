import { readDatabase, updateDatabase } from '../lib/localDatabase.js'
import { canManageTickets } from '../utils/permissions.js'

export const TICKET_STATUSES = ['Em aberto', 'Em andamento', 'Resolvido']

function assertOrganisation(organisationId) {
  if (!organisationId) {
    throw new Error('Não foi possível identificar o condomínio dos chamados.')
  }
}

export async function fetchTickets(organisationId, userId, accessType) {
  assertOrganisation(organisationId)
  const canViewAll = canManageTickets(accessType)

  return readDatabase().tickets
    .filter((item) => (
      String(item.organisation_id) === String(organisationId)
      && (canViewAll || String(item.creator_id ?? '') === String(userId ?? ''))
    ))
    .sort((first, second) => second.created_at.localeCompare(first.created_at))
}

export async function createTicket(organisationId, values) {
  assertOrganisation(organisationId)
  const ticket = {
    ...values,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    organisation_id: String(organisationId),
    created_at: new Date().toISOString(),
  }

  return updateDatabase((database) => {
    database.tickets.unshift(ticket)
    return ticket
  })
}

export async function updateTicketStatus(organisationId, ticketId, situacao, accessType) {
  assertOrganisation(organisationId)

  if (!canManageTickets(accessType)) {
    throw new Error('Apenas o síndico e os funcionários podem alterar a situação do chamado.')
  }

  if (!TICKET_STATUSES.includes(situacao)) {
    throw new Error('Selecione uma situação válida para o chamado.')
  }

  return updateDatabase((database) => {
    const ticketIndex = database.tickets.findIndex((item) => (
      String(item.id) === String(ticketId) && String(item.organisation_id) === String(organisationId)
    ))

    if (ticketIndex < 0) {
      throw new Error('Este chamado não foi encontrado.')
    }

    const updatedTicket = { ...database.tickets[ticketIndex], situacao }
    database.tickets[ticketIndex] = updatedTicket
    return updatedTicket
  })
}
