'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bankAccount, user } from '@/lib/db/schema'
import { ADMIN_EMAIL } from '@/lib/bank-constants'
import { desc, eq, ne } from 'drizzle-orm'
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

export async function listMemberAccounts(): Promise<MemberAccountRow[]> {
  await requireAdmin()

  const members = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(ne(user.email, ADMIN_EMAIL))
    .orderBy(desc(user.createdAt))

  const rows: MemberAccountRow[] = []

  for (const member of members) {
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
      name: member.name,
      email: member.email,
      phone: null,
      checkingId: checking?.id ?? null,
      checkingNumber: checking?.accountNumber ?? null,
      checkingBalanceCents: Number(checking?.balanceCents ?? 0),
      savingsId: savings?.id ?? null,
      savingsNumber: savings?.accountNumber ?? null,
      savingsBalanceCents: Number(savings?.balanceCents ?? 0),
    })
  }

  return rows
}
