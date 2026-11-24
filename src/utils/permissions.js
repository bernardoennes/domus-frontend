function normalizeAccessType(accessType) {
  return String(accessType ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

export function canManageCondominium(membership) {
  return normalizeAccessType(membership?.access_type) === 'SINDICO'
}

export function canManageTickets(accessType) {
  return ['SINDICO', 'FUNCIONARIO'].includes(normalizeAccessType(accessType))
}