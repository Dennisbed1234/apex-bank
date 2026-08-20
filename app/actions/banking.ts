'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bankAccount, transaction } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

function randomAccountNumber() {
  return String(Math.floor(1_000_000_000 + Math.random() * 8_999_999_999))
}

const SEED_TX: Array<{
  description: string
  category: string
  counterparty: string
  amountCents: number
}> = [
  { description: 'Payroll deposit', category: 'Income', counterparty: 'Acme Corp', amountCents: 420000 },
  { description: 'Whole Foods Market', category: 'Groceries', counterparty: 'Whole Foods', amountCents: -8734 },
  { description: 'Monthly rent', category: 'Housing', counterparty: 'Skyline Realty', amountCents: -185000 },
  { description: 'Spotify Premium', category: 'Subscriptions', counterparty: 'Spotify', amountCents: -1099 },
  { description: 'Uber ride', category: 'Transport', counterparty: 'Uber', amountCents: -2340 },
  { description: 'Refund — online order', category: 'Refund', counterparty: 'Amazon', amountCents: 4599 },
  { description: 'Electric bill', category: 'Utilities', counterparty: 'ConEd', amountCents: -11245 },
  { description: 'Coffee', category: 'Dining', counterparty: 'Blue Bottle', amountCents: -675 },
]

/**
 * Ensures the signed-in user has starter accounts + sample transactions.
 * Idempotent: does nothing if the user already has accounts.
 */
export async function ensureSeeded() {
  const userId = await getUserId()

  const existing = await db
    .select({ id: bankAccount.id })
    .from(bankAccount)
    .where(eq(bankAccount.userId, userId))
    .limit(1)

  if (existing.length > 0) return

  const [checking] = await db
    .insert(bankAccount)
    .values({
      userId,
      name: 'Everyday Checking',
      type: 'checking',
      accountNumber: randomAccountNumber(),
      balanceCents: 0,
    })
    .returning()

  const [savings] = await db
    .insert(bankAccount)
    .values({
      userId,
      name: 'High-Yield Savings',
      type: 'savings',
      accountNumber: randomAccountNumber(),
      balanceCents: 1_250_000,
    })
    .returning()

  let checkingBalance = 0
  for (const t of SEED_TX) {
    checkingBalance += t.amountCents
    await db.insert(transaction).values({
      userId,
      accountId: checking.id,
      amountCents: t.amountCents,
      type: t.amountCents >= 0 ? 'credit' : 'debit',
      description: t.description,
      category: t.category,
      counterparty: t.counterparty,
    })
  }

  await db
    .update(bankAccount)
    .set({ balanceCents: checkingBalance })
    .where(and(eq(bankAccount.id, checking.id), eq(bankAccount.userId, userId)))

  await db.insert(transaction).values({
    userId,
    accountId: savings.id,
    amountCents: 1_250_000,
    type: 'credit',
    description: 'Opening deposit',
    category: 'Income',
    counterparty: 'Apex Bank',
  })

}

export async function getAccounts() {
  const userId = await getUserId()
  return db
    .select()
    .from(bankAccount)
    .where(eq(bankAccount.userId, userId))
    .orderBy(bankAccount.id)
}

export async function getTransactions(limit = 50) {
  const userId = await getUserId()
  return db
    .select()
    .from(transaction)
    .where(eq(transaction.userId, userId))
    .orderBy(desc(transaction.createdAt), desc(transaction.id))
    .limit(limit)
}

export type TransferResult = { ok: true } | { ok: false; error: string }

export async function transferFunds(input: {
  fromAccountId: number
  toAccountId: number
  amountDollars: number
  note?: string
}): Promise<TransferResult> {
  const userId = await getUserId()

  const { fromAccountId, toAccountId, amountDollars, note } = input

  if (fromAccountId === toAccountId) {
    return { ok: false, error: 'Choose two different accounts.' }
  }
  if (!Number.isFinite(amountDollars) || amountDollars <= 0) {
    return { ok: false, error: 'Enter a valid amount greater than zero.' }
  }

  const amountCents = Math.round(amountDollars * 100)

  // Load both accounts, scoped to this user.
  const accounts = await db
    .select()
    .from(bankAccount)
    .where(eq(bankAccount.userId, userId))

  const from = accounts.find((a) => a.id === fromAccountId)
  const to = accounts.find((a) => a.id === toAccountId)

  if (!from || !to) {
    return { ok: false, error: 'Account not found.' }
  }
  if (from.balanceCents < amountCents) {
    return { ok: false, error: 'Insufficient funds in the source account.' }
  }

  const description = note?.trim()
    ? note.trim()
    : `Transfer to ${to.name}`

  // Debit source
  await db
    .update(bankAccount)
    .set({ balanceCents: sql`${bankAccount.balanceCents} - ${amountCents}` })
    .where(and(eq(bankAccount.id, from.id), eq(bankAccount.userId, userId)))

  // Credit destination
  await db
    .update(bankAccount)
    .set({ balanceCents: sql`${bankAccount.balanceCents} + ${amountCents}` })
    .where(and(eq(bankAccount.id, to.id), eq(bankAccount.userId, userId)))

  await db.insert(transaction).values({
    userId,
    accountId: from.id,
    amountCents: -amountCents,
    type: 'transfer',
    description,
    category: 'Transfer',
    counterparty: to.name,
  })

  await db.insert(transaction).values({
    userId,
    accountId: to.id,
    amountCents: amountCents,
    type: 'transfer',
    description: `Transfer from ${from.name}`,
    category: 'Transfer',
    counterparty: from.name,
  })

  revalidatePath('/dashboard')
  return { ok: true }
}
