import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'

const SCRYPT_PREFIX = 'scrypt'
const SCRYPT_N = 16_384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LENGTH = 64

const legacySha256 = (password: string): string =>
  createHash('sha256').update(password).digest('hex')

export const hashSecurePassword = (password: string): string => {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 64 * 1024 * 1024,
  })
  return [
    SCRYPT_PREFIX,
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt,
    derived.toString('hex'),
  ].join('$')
}

export const verifyStoredPassword = (
  password: string,
  storedHash: string,
): { valid: boolean; needsUpgrade: boolean } => {
  const parts = String(storedHash || '').split('$')
  if (parts.length === 6 && parts[0] === SCRYPT_PREFIX) {
    const [, nRaw, rRaw, pRaw, salt, expectedHex] = parts
    const n = Number(nRaw)
    const r = Number(rRaw)
    const p = Number(pRaw)
    if (!(n > 1 && r > 0 && p > 0 && salt && /^[a-f0-9]+$/i.test(expectedHex))) {
      return { valid: false, needsUpgrade: false }
    }
    try {
      const actual = scryptSync(password, salt, expectedHex.length / 2, {
        N: n,
        r,
        p,
        maxmem: 64 * 1024 * 1024,
      })
      const expected = Buffer.from(expectedHex, 'hex')
      return {
        valid:
          actual.length === expected.length &&
          timingSafeEqual(actual, expected),
        needsUpgrade: false,
      }
    } catch {
      return { valid: false, needsUpgrade: false }
    }
  }

  const legacy = legacySha256(password)
  const expected = Buffer.from(String(storedHash || ''))
  const actual = Buffer.from(legacy)
  return {
    valid:
      expected.length === actual.length &&
      timingSafeEqual(expected, actual),
    needsUpgrade: true,
  }
}

export const validateAdminPassword = (password: string): void => {
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error('密码至少8个字符，且必须包含字母和数字')
  }
}
