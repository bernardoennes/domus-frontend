export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

const passwordRules = [
  {
    key: 'length',
    label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
    message: `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    key: 'maximum',
    label: `No máximo ${PASSWORD_MAX_LENGTH} caracteres`,
    message: `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
    test: (value) => value.length <= PASSWORD_MAX_LENGTH,
  },
  { key: 'number', label: 'Conter número', message: 'A senha deve conter um número.', test: (value) => /\d/.test(value) },
  { key: 'special', label: 'Conter caractere especial', message: 'A senha deve conter um caractere especial.', test: (value) => /[^A-Za-z0-9]/.test(value) },
]

export function getPasswordValidation(password) {
  return passwordRules.map((rule) => ({
    ...rule,
    isValid: rule.test(password),
  }))
}

export function getPasswordError(password) {
  const invalidRule = getPasswordValidation(String(password ?? '')).find((rule) => !rule.isValid)
  return invalidRule?.message ?? ''
}
