const ITERATIONS = 100_000

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function derive(password, salt) {
  const subtle = window.crypto?.subtle

  if (!subtle) {
    throw new Error('Este navegador não oferece suporte à proteção de senhas. Use um endereço seguro (https ou localhost).')
  }

  const key = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: ITERATIONS },
    key,
    256,
  )

  return toHex(bits)
}

export async function createPasswordHash(password) {
  const salt = toHex(window.crypto.getRandomValues(new Uint8Array(16)))
  return { salt, hash: await derive(password, salt) }
}

export async function verifyPassword(password, stored) {
  if (!stored?.salt || !stored?.hash) {
    return false
  }

  return (await derive(password, stored.salt)) === stored.hash
}
