import {
  DEFAULT_ORGANISATION_ID,
  clearSession,
  getNextId,
  readDatabase,
  readSessionUserId,
  updateDatabase,
  writeSessionUserId,
} from '../lib/localDatabase.js'
import { createPasswordHash, verifyPassword } from '../lib/password.js'
import { isValidCpf, normalizeCpf } from '../utils/cpfValidation.js'
import { getPasswordError } from '../utils/passwordValidation.js'
import { maskCpf } from './userService.js'

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    cpf_masked: maskCpf(user.cpf),
  }
}

function sanitizeMembership(membership) {
  return {
    organisation_id: membership.organisation_id,
    access_type: membership.access_type,
  }
}

function buildSession(database, userId) {
  const user = database.users.find((item) => item.id === userId)
  const membership = database.memberships.find((item) => item.user_id === userId)

  if (!user || !membership) {
    return null
  }

  return {
    user: sanitizeUser(user),
    membership: sanitizeMembership(membership),
  }
}

export function getCurrentSession() {
  const userId = readSessionUserId()

  if (userId === null) {
    return null
  }

  return buildSession(readDatabase(), userId)
}

// Enquanto nenhuma conta tem senha, não há como entrar e o administrador pode ser cadastrado.
function isAdminSetupPending(database) {
  return database.users.every((user) => !user.password)
}

export function needsAdminSetup() {
  try {
    return isAdminSetupPending(readDatabase())
  } catch {
    return false
  }
}

function assertValidPassword(password) {
  const passwordError = getPasswordError(password)

  if (passwordError) {
    throw new Error(passwordError)
  }
}

export async function registerAdmin({ name, cpf, password }) {
  const normalizedCpf = normalizeCpf(cpf)
  const adminName = String(name ?? '').trim()

  if (!adminName) {
    throw new Error('Informe o nome do administrador.')
  }

  if (!isValidCpf(normalizedCpf)) {
    throw new Error('CPF inválido.')
  }

  assertValidPassword(password)
  const passwordHash = await createPasswordHash(password)

  updateDatabase((database) => {
    if (!isAdminSetupPending(database)) {
      throw new Error('Já existe um administrador cadastrado. Entre com seu CPF e senha.')
    }

    // Descarta cadastros sem senha (ex.: usuário padrão de versões anteriores).
    database.users = []
    database.memberships = []
    database.residents = []
    database.employees = []

    const admin = { id: getNextId(database, 'users'), name: adminName, cpf: normalizedCpf, password: passwordHash }
    database.users.push(admin)
    database.memberships.push({
      id: getNextId(database, 'memberships'),
      user_id: admin.id,
      organisation_id: DEFAULT_ORGANISATION_ID,
      access_type: 'SINDICO',
    })
  })

  return { admin_registered: true }
}

export async function registerFirstAccess({ cpf, password }) {
  const normalizedCpf = normalizeCpf(cpf)

  if (!normalizedCpf) {
    throw new Error('CPF obrigatório.')
  }

  assertValidPassword(password)
  const passwordHash = await createPasswordHash(password)

  updateDatabase((database) => {
    if (isAdminSetupPending(database)) {
      throw new Error('Ainda não há administrador. Cadastre-o na tela de login.')
    }

    const user = database.users.find((item) => item.cpf === normalizedCpf)

    if (!user || !database.memberships.some((item) => item.user_id === user.id)) {
      throw new Error('CPF não cadastrado. Peça ao síndico para realizar o seu cadastro.')
    }

    if (user.password) {
      throw new Error('O primeiro acesso deste CPF já foi concluído. Entre com sua senha.')
    }

    user.password = passwordHash
  })

  return { first_access_completed: true }
}

export async function loginUser(credentials) {
  const cpf = normalizeCpf(credentials.cpf)
  const database = readDatabase()
  const user = database.users.find((item) => item.cpf === cpf)

  if (!user || !(await verifyPassword(credentials.password ?? '', user.password))) {
    throw new Error('Não foi possível entrar. Confira o CPF e a senha e tente novamente.')
  }

  const session = buildSession(database, user.id)

  if (!session) {
    throw new Error('Não foi possível carregar seu acesso ao condomínio.')
  }

  writeSessionUserId(user.id)
  return session
}

export function logoutUser() {
  clearSession()
}
