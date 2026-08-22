import { pool } from '@/lib/db'

let ensured = false

/** Add profile columns if this Neon database was created before they existed. */
export async function ensureUserProfileColumns() {
  if (ensured) return
  try {
    await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" text`)
    await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "dateOfBirth" text`)
    ensured = true
  } catch (err) {
    console.error('[db] ensureUserProfileColumns', err)
  }
}
