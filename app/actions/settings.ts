'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { kycSubmission, user } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

function isValidUsPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))
}

export async function getProfileSettings() {
  const sessionUser = await getSessionUser()
  const rows = await db
    .select({
      name: user.name,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
    })
    .from(user)
    .where(eq(user.id, sessionUser.id))
    .limit(1)

  const profile = rows[0]
  const kyc = await db
    .select({
      id: kycSubmission.id,
      status: kycSubmission.status,
      idType: kycSubmission.idType,
      ssnLast4: kycSubmission.ssnLast4,
      createdAt: kycSubmission.createdAt,
    })
    .from(kycSubmission)
    .where(eq(kycSubmission.userId, sessionUser.id))
    .orderBy(desc(kycSubmission.createdAt))
    .limit(1)

  return {
    name: profile?.name || sessionUser.name,
    email: profile?.email || sessionUser.email,
    phone: profile?.phone || '',
    dateOfBirth: profile?.dateOfBirth || '',
    kyc: kyc[0]
      ? {
          status: kyc[0].status,
          idType: kyc[0].idType,
          ssnLast4: kyc[0].ssnLast4,
          submittedAt: kyc[0].createdAt.toISOString(),
        }
      : null,
  }
}

export type SettingsResult = { ok: true } | { ok: false; error: string }

export async function updatePhoneNumber(phone: string): Promise<SettingsResult> {
  const sessionUser = await getSessionUser()
  const trimmed = phone.trim()
  if (!isValidUsPhone(trimmed)) {
    return { ok: false, error: 'Enter a valid U.S. phone number (10 digits).' }
  }

  await db
    .update(user)
    .set({ phone: trimmed, updatedAt: new Date() })
    .where(eq(user.id, sessionUser.id))

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function submitKyc(formData: FormData): Promise<SettingsResult> {
  const sessionUser = await getSessionUser()

  const ssnRaw = String(formData.get('ssn') || '').replace(/\D/g, '')
  const idType = String(formData.get('idType') || '')
  const front = formData.get('idFront')
  const back = formData.get('idBack')

  if (ssnRaw.length !== 9) {
    return { ok: false, error: 'SSN must be 9 digits.' }
  }
  if (idType !== 'drivers_license' && idType !== 'state_id') {
    return { ok: false, error: 'Select Driver license or State-issued ID.' }
  }
  if (!(front instanceof File) || front.size === 0) {
    return { ok: false, error: 'Upload the front of your ID.' }
  }
  if (!(back instanceof File) || back.size === 0) {
    return { ok: false, error: 'Upload the back of your ID.' }
  }
  if (front.size > 4_000_000 || back.size > 4_000_000) {
    return { ok: false, error: 'Each ID image must be under 4 MB.' }
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowed.includes(front.type) || !allowed.includes(back.type)) {
    return { ok: false, error: 'ID files must be JPG, PNG, WEBP, or PDF.' }
  }

  const frontBuf = Buffer.from(await front.arrayBuffer())
  const backBuf = Buffer.from(await back.arrayBuffer())

  await db.insert(kycSubmission).values({
    userId: sessionUser.id,
    ssnLast4: ssnRaw.slice(-4),
    ssnEncrypted: ssnRaw, // demo only — use encryption at rest in production
    idType,
    idFrontName: front.name || 'id-front',
    idFrontMime: front.type,
    idFrontData: frontBuf.toString('base64'),
    idBackName: back.name || 'id-back',
    idBackMime: back.type,
    idBackData: backBuf.toString('base64'),
    status: 'pending',
  })

  revalidatePath('/dashboard/settings')
  return { ok: true }
}
