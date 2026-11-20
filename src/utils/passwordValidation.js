const passwordRules = [
  { key: 'length', label: 'Pelo menos 8 caracteres', message: 'A senha deve ter pelo menos 8 caracteres.', test: (value) => value.length >= 8 },
  { key: 'maximum', label: 'No máximo 128 caracteres', message: 'A senha deve ter no máximo 128 caracteres.', test: (value) => value.length <= 128 },
  { key: 'number', label: 'Conter número', message: 'A senha deve conter um número.', test: (value) => /\d/.test(value) },
  { key: 'special', label: 'Conter caractere especial', message: 'A senha deve conter um caractere especial.', test: (value) => /[^A-Za-z0-9]/.test(value) },
]

export function getPasswordValidation(password) {
  return passwordRules.map((rule) => ({
    ...rule,
    isValid: rule.test(password),
  }))
}
