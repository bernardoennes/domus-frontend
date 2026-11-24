const DATABASE_KEY = 'condominio:database'
const SESSION_KEY = 'condominio:session'
const TABLES = [
  'organisations',
  'users',
  'memberships',
  'residents',
  'employees',
  'areas',
  'reservations',
  'announcements',
  'tickets',
]
export const DEFAULT_ORGANISATION_ID = 1

function createSeedDatabase() {
  return {
    sequences: {
      organisations: 1,
      users: 0,
      memberships: 0,
      residents: 0,
      employees: 0,
      areas: 0,
      reservations: 0,
    },
    organisations: [{ id: DEFAULT_ORGANISATION_ID, name: 'Condomínio' }],
    users: [],
    memberships: [],
    residents: [],
    employees: [],
    areas: [],
    reservations: [],
    announcements: [],
    tickets: [],
  }
}

export function writeDatabase(database) {
  try {
    window.localStorage.setItem(DATABASE_KEY, JSON.stringify(database))
  } catch {
    throw new Error('Não foi possível salvar os dados neste navegador.')
  }
}

export function readDatabase() {
  let storedValue

  try {
    storedValue = window.localStorage.getItem(DATABASE_KEY)
  } catch {
    throw new Error('Não foi possível acessar o armazenamento local deste navegador.')
  }

  if (!storedValue) {
    const seedDatabase = createSeedDatabase()
    writeDatabase(seedDatabase)
    return seedDatabase
  }

  let database

  try {
    database = JSON.parse(storedValue)
  } catch {
    throw new Error('Os dados salvos estão corrompidos e não puderam ser carregados.')
  }

  if (!database || typeof database !== 'object' || Array.isArray(database)) {
    throw new Error('O formato dos dados salvos é inválido.')
  }

  if (!('announcements' in database)) database.announcements = []
  if (!('tickets' in database)) database.tickets = []

  if (TABLES.some((table) => !Array.isArray(database[table]))) {
    throw new Error('O formato dos dados salvos é inválido.')
  }

  database.areas = database.areas.map((area) => ({
    ...area,
    is_deleted: Boolean(area.is_deleted),
  }))
  database.announcements = database.announcements.map((announcement) => ({
    ...announcement,
    comments: Array.isArray(announcement.comments) ? announcement.comments : [],
  }))

  return database
}

export function updateDatabase(mutate) {
  const database = readDatabase()
  const result = mutate(database)
  writeDatabase(database)
  return result
}

export function getNextId(database, table) {
  const lastId = database.sequences?.[table] ?? Math.max(0, ...database[table].map((row) => Number(row.id) || 0))
  const nextId = lastId + 1
  database.sequences = { ...database.sequences, [table]: nextId }
  return nextId
}

export function readSessionUserId() {
  try {
    const value = JSON.parse(window.localStorage.getItem(SESSION_KEY))
    return value?.userId ?? null
  } catch {
    return null
  }
}

export function writeSessionUserId(userId) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }))
  } catch {
    throw new Error('Não foi possível iniciar sua sessão neste navegador.')
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY)
  } catch {
    // Sem acesso ao armazenamento não há sessão a limpar.
  }
}
