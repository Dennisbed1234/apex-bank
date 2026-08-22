'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bankAccount, user } from '@/lib/db/schema'
import {
  ADMIN_EMAIL,
  DEMO_MEMBER_EMAIL,
  SHARED_CHECKING_NUMBER,
} from '@/lib/bank-constants'
import { applyTwoYearPersonalHistory } from '@/lib/seed-history'
import { desc, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'

export type MemberAccountRow = {
  userId: string
  name: string
  email: string
  phone: string | null
  checkingId: number | null
  checkingNumber: string | null
  checkingBalanceCents: number
  savingsId: number | null
  savingsNumber: string | null
  savingsBalanceCents: number
}

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  const email = String(session.user.email || '').trim().toLowerCase()
  if (email !== ADMIN_EMAIL) throw new Error('Admin access required')
  return session.user
}

function randomSavingsNumber() {
  let n = ''
  do {
    n = String(Math.floor(1_000_000_000 + Math.random() * 8_999_999_999))
  } while (n === SHARED_CHECKING_NUMBER)
  return n
}

/** Align Dennis checking # with admin and seed 2 years of activity. */
export async function ensureDemoMemberProfile() {
  await requireAdmin()

  const matches = await db
    .select({
      id: user.id,
      email: user.email,
    })
    .from(user)
    .where(sql`lower(${user.email}) = ${DEMO_MEMBER_EMAIL}`)
    .limit(1)

  const demo = matches[0]
  if (!demo) return

  const accounts = await db
    .select()
    .from(bankAccount)
    .where(eq(bankAccount.userId, demo.id))

  let checking = accounts.find((a) => a.type === 'checking')
  const savings = accounts.find((a) => a.type === 'savings')

  if (!checking) {
    const [created] = await db
      .insert(bankAccount)
      .values({
        userId: demo.id,
        name: 'Everyday Checking',
        type: 'checking',
        accountNumber: SHARED_CHECKING_NUMBER,
        balanceCents: 0,
      })
      .returning()
    checking = created
  } else if (checking.accountNumber !== SHARED_CHECKING_NUMBER) {
    await db
      .update(bankAccount)
      .set({ accountNumber: SHARED_CHECKING_NUMBER, name: 'Everyday Checking' })
      .where(eq(bankAccount.id, checking.id))
  }

  if (!savings) {
    await db.insert(bankAccount).values({
      userId: demo.id,
      name: 'High-Yield Savings',
      type: 'savings',
      accountNumber: randomSavingsNumber(),
      balanceCents: 155000,
    })
  } else if (savings.accountNumber === SHARED_CHECKING_NUMBER) {
    await db
      .update(bankAccount)
      .set({ accountNumber: randomSavingsNumber() })
      .where(eq(bankAccount.id, savings.id))
  }

  await applyTwoYearPersonalHistory(demo.id, checking.id)
}

export async function listMemberAccounts(): Promise<MemberAccountRow[]> {
  await requireAdmin()

  const members = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(sql`lower(${user.email}) <> ${ADMIN_EMAIL}`)
    .orderBy(desc(user.createdAt))

  const rows: MemberAccountRow[] = []

  for (const member of members) {
    try {
      const accounts = await db
        .select({
          id: bankAccount.id,
          type: bankAccount.type,
          accountNumber: bankAccount.accountNumber,
          balanceCents: bankAccount.balanceCents,
        })
        .from(bankAccount)
        .where(eq(bankAccount.userId, member.id))

      const checking = accounts.find((a) => a.type === 'checking')
      const savings = accounts.find((a) => a.type === 'savings')

      rows.push({
        userId: member.id,
        name: member.name || 'Member',
        email: member.email,
        phone: null,
        checkingId: checking?.id ?? null,
        checkingNumber: checking?.accountNumber ?? null,
        checkingBalanceCents: Number(checking?.balanceCents ?? 0),
        savingsId: savings?.id ?? null,
        savingsNumber: savings?.accountNumber ?? null,
        savingsBalanceCents: Number(savings?.balanceCents ?? 0),
      })
    } catch (err) {
      console.error('[ops] account lookup failed for', member.id, err)
      rows.push({
        userId: member.id,
        name: member.name || 'Member',
        email: member.email,
        phone: null,
        checkingId: null,
        checkingNumber: null,
        checkingBalanceCents: 0,
        savingsId: null,
        savingsNumber: null,
        savingsBalanceCents: 0,
      })
    }
  }

  return rows
}
