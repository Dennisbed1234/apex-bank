/** Stable, Luhn-valid Visa debit PAN unique to each member. */

const APEX_BIN = '414720' // 6-digit Visa issuer BIN (Apex demo)

function hashSeed(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function luhnCheckDigit(body: string) {
  let sum = 0
  let dbl = true
  for (let i = body.length - 1; i >= 0; i--) {
    let n = Number(body[i])
    if (dbl) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    dbl = !dbl
  }
  return String((10 - (sum % 10)) % 10)
}

export function isValidLuhn(pan: string) {
  const digits = pan.replace(/\D/g, '')
  if (digits.length !== 16) return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i])
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

export function issueVisaCard(userId: string) {
  const h = hashSeed(`apex-visa:${userId}`)
  const accountPart = String(h).padStart(9, '0').slice(-9)
  const body = `${APEX_BIN}${accountPart}` // 15 digits
  const pan = body + luhnCheckDigit(body)
  const cvv = String((h % 900) + 100)
  const expMonth = String(((h % 12) + 1)).padStart(2, '0')
  const expYear = String(29 + (h % 3))

  return {
    pan,
    formatted: pan.replace(/(\d{4})(?=\d)/g, '$1 '),
    last4: pan.slice(-4),
    cvv,
    exp: `${expMonth}/${expYear}`,
  }
}
