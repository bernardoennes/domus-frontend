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
    .filter((area) => (
      String(area.organisation_id) === String(organisationId)
      && !area.is_deleted
    ))
    .sort((first, second) => first.id - second.id)
}

function getAreaSettings({ availableWeekdays, startHour, endHour }) {
  const weekdays = (availableWeekdays ?? []).map(Number)
  if (weekdays.length === 0 || weekdays.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) {
    throw new Error('Selecione pelo menos um dia da semana.')
  }
  const validTime = (time) => !time || /^(?:[01]\d|2[0-3]):(?:00|30)$/.test(time)
  if (!validTime(startHour) || !validTime(endHour)) {
    throw new Error('Selecione horários em intervalos de 30 minutos.')
  }
  if (startHour && endHour && startHour >= endHour) {
    throw new Error('O horário final precisa ser posterior ao horário inicial.')
  }
  return {
    available_weekdays: [...new Set(weekdays)].sort((first, second) => first - second),
    start_hour: startHour || null,
    end_hour: endHour || null,
  }
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

  const settings = getAreaSettings({ availableWeekdays, startHour, endHour })

  return updateDatabase((database) => {
    const organisation = database.organisations.find((item) => String(item.id) === String(organisationId))
    if (!organisation) {
      throw new Error('Não foi possível identificar o condomínio desta área.')
    }

    const deletedArea = database.areas
      .filter((item) => (
        String(item.organisation_id) === String(organisationId)
        && item.area_type === areaType
        && item.is_deleted
      ))
      .sort((first, second) => first.id - second.id)[0]
    if (deletedArea) {
      Object.assign(deletedArea, settings, { is_deleted: false })
      return { ...deletedArea, reactivated: true }
    }

    const area = {
      id: getNextId(database, 'areas'),
      area_type: areaType,
      organisation_id: organisation.id,
      ...settings,
      is_deleted: false,
    }

    database.areas.push(area)
    return { ...area, reactivated: false }
  })
}

export async function updateCommonArea({ organisationId, areaId, availableWeekdays, startHour, endHour }) {
  if (!organisationId || !Number.isSafeInteger(Number(areaId))) {
    throw new Error('Não foi possível identificar a área comum ou o condomínio.')
  }
  const settings = getAreaSettings({ availableWeekdays, startHour, endHour })
  return updateDatabase((database) => {
    const area = database.areas.find((item) => (
      String(item.id) === String(areaId)
      && String(item.organisation_id) === String(organisationId)
      && !item.is_deleted
    ))
    if (!area) {
      throw new Error('Esta área comum não foi encontrada.')
    }
    Object.assign(area, settings)
    return { ...area }
  })
}

export async function removeCommonArea({ organisationId, areaId }) {
  if (!organisationId || !Number.isSafeInteger(Number(areaId))) {
    throw new Error('Não foi possível identificar a área comum ou o condomínio.')
  }

  return updateDatabase((database) => {
    const area = database.areas.find((item) => (
      String(item.id) === String(areaId)
      && String(item.organisation_id) === String(organisationId)
      && !item.is_deleted
    ))

    if (!area) {
      throw new Error('Esta área comum não foi encontrada.')
    }

    area.is_deleted = true

    return { success: true }
  })
}
