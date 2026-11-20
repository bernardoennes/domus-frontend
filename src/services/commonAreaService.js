import { getNextId, readDatabase, updateDatabase } from '../lib/localDatabase.js'

export const AREA_TYPE_LABELS = {
  SWIMMING_POOL: 'Piscina',
  TERRACE: 'Terraço',
  BARBECUE_AREA: 'Churrasqueira',
  PARTY_HALL: 'Salão de festas',
  GAME_ROOM: 'Salão de jogos',
  GYM: 'Academia',
  SAUNA: 'Sauna',
  EVENT_SPACE: 'Espaço de eventos',
}

export async function fetchCommonAreas(organisationId) {
  if (!organisationId) {
    return []
  }

  return readDatabase().areas
    .filter((area) => String(area.organisation_id) === String(organisationId))
    .sort((first, second) => first.id - second.id)
}

export async function createCommonArea({
  organisationId,
  areaType,
  availableWeekdays,
  startHour,
  endHour,
}) {
  if (!AREA_TYPE_LABELS[areaType]) {
    throw new Error('Selecione um tipo de área comum válido.')
  }

  const weekdays = (availableWeekdays ?? []).map(Number)

  if (weekdays.length === 0 || weekdays.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) {
    throw new Error('Selecione pelo menos um dia da semana.')
  }

  return updateDatabase((database) => {
    if (!database.organisations.some((item) => String(item.id) === String(organisationId))) {
      throw new Error('Não foi possível identificar o condomínio desta área.')
    }

    const area = {
      id: getNextId(database, 'areas'),
      area_type: areaType,
      organisation_id: database.organisations.find((item) => String(item.id) === String(organisationId)).id,
      available_weekdays: [...new Set(weekdays)].sort((first, second) => first - second),
      start_hour: startHour || null,
      end_hour: endHour || null,
    }

    database.areas.push(area)
    return area
  })
}
