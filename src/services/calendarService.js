import { getNextId, readDatabase, updateDatabase } from '../lib/localDatabase.js'
import { AREA_TYPE_LABELS } from './commonAreaService.js'

function toMinutes(time) {
  const [hours, minutes] = String(time).slice(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}

function mapReservation(reservation, areas, users) {
  const area = areas.find((item) => String(item.id) === String(reservation.reserved_area))
  const user = users.find((item) => String(item.id) === String(reservation.reserved_by))

  return {
    id: String(reservation.id),
    areaId: String(reservation.reserved_area),
    areaName: area?.displayName ?? AREA_TYPE_LABELS[area?.area_type] ?? 'Área comum',
    date: reservation.date,
    startTime: reservation.start_date,
    endTime: reservation.end_date,
    residentName: user?.name ?? 'Morador',
    userId: reservation.reserved_by ? String(reservation.reserved_by) : null,
    isEvent: Boolean(reservation.is_event),
    numberOfPeople: reservation.participants,
    observations: reservation.observations ?? '',
  }
}

export async function fetchCalendarReservations(organisationId, _areas) {
  if (!organisationId) {
    return []
  }

  const database = readDatabase()
  const organisationAreas = database.areas.filter((area) => (
    String(area.organisation_id) === String(organisationId)
  ))
  const areaIds = new Set(organisationAreas.map((area) => String(area.id)))

  return database.reservations
    .filter((reservation) => areaIds.has(String(reservation.reserved_area)))
    .map((reservation) => mapReservation(reservation, organisationAreas, database.users))
}

export async function saveCalendarReservation({ organisationId, reservation, area, profile, isEvent }) {
  if (!organisationId) {
    throw new Error('Não foi possível identificar o condomínio desta reserva.')
  }

  const details = {
    start_date: reservation.startTime,
    end_date: reservation.endTime,
    is_event: Boolean(isEvent),
    participants: reservation.numberOfPeople,
    observations: reservation.observations ?? '',
  }

  return updateDatabase((database) => {
    const isEditing = Boolean(reservation.id)
    const existing = isEditing
      ? database.reservations.find((item) => String(item.id) === String(reservation.id))
      : null
    const areaId = existing?.reserved_area ?? area?.id
    const date = existing?.date ?? reservation.date
    const storedArea = database.areas.find((item) => (
      String(item.id) === String(areaId) && String(item.organisation_id) === String(organisationId)
    ))

    if (isEditing && !existing) {
      throw new Error('Esta reserva não foi encontrada.')
    }

    if (!storedArea) {
      throw new Error('A área comum selecionada não foi encontrada.')
    }

    if (storedArea.is_deleted) {
      throw new Error('Esta área comum foi excluída e não aceita novas reservas.')
    }

    if (toMinutes(details.start_date) >= toMinutes(details.end_date)) {
      throw new Error('O horário final precisa ser posterior ao horário inicial.')
    }

    const hasConflict = database.reservations.some((item) => (
      item !== existing
      && String(item.reserved_area) === String(storedArea.id)
      && item.date === date
      && toMinutes(details.start_date) < toMinutes(item.end_date)
      && toMinutes(details.end_date) > toMinutes(item.start_date)
    ))

    if (hasConflict) {
      throw new Error('Este horário já possui uma reserva para a área selecionada.')
    }

    let saved = existing

    if (existing) {
      Object.assign(existing, details)
    } else {
      const reservedBy = reservation.userId ?? profile?.id

      if (!reservedBy) {
        throw new Error('Não foi possível identificar o responsável pela reserva.')
      }

      saved = {
        id: getNextId(database, 'reservations'),
        reserved_by: reservedBy,
        reserved_area: storedArea.id,
        date,
        ...details,
      }
      database.reservations.push(saved)
    }

    return mapReservation(saved, [area ?? storedArea], database.users)
  })
}

export async function deleteCalendarReservation(reservationId) {
  updateDatabase((database) => {
    const remaining = database.reservations.filter((item) => String(item.id) !== String(reservationId))

    if (remaining.length === database.reservations.length) {
      throw new Error('Esta reserva não foi encontrada.')
    }

    database.reservations = remaining
  })
}

export function getNationalHolidays(year) {
  const holidays = [
    ['01-01', 'Confraternização Universal'],
    ['04-21', 'Tiradentes'],
    ['05-01', 'Dia Mundial do Trabalho'],
    ['09-07', 'Independência do Brasil'],
    ['10-12', 'Nossa Senhora Aparecida'],
    ['11-02', 'Finados'],
    ['11-15', 'Proclamação da República'],
    ['11-20', 'Dia Nacional de Zumbi e da Consciência Negra'],
    ['12-25', 'Natal'],
  ]

  return holidays.map(([monthDay, title]) => ({
    id: `holiday-${year}-${monthDay}`,
    date: `${year}-${monthDay}`,
    title,
    type: 'holiday',
  }))
}
