'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bankAccount, transaction } from '@/lib/db/schema'
import {
  ADMIN_EMAIL,
  SHARED_CHECKING_NUMBER,
} from '@/lib/bank-constants'
import { and, desc, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

function randomSavingsNumber() {
  let n = ''
  do {
    n = String(Math.floor(1_000_000_000 + Math.random() * 8_999_999_999))
  } while (n === SHARED_CHECKING_NUMBER)
  return n
}

const REGULAR_SEED_TX: Array<{
  description: string
  category: string
  counterparty: string
  amountCents: number
  daysAgo: number
}> = [
  { description: 'Payroll deposit', category: 'Income', counterparty: 'Acme Corp', amountCents: 420000, daysAgo: 2 },
  { description: 'Whole Foods Market', category: 'Groceries', counterparty: 'Whole Foods', amountCents: -8734, daysAgo: 3 },
  { description: 'Monthly rent', category: 'Housing', counterparty: 'Skyline Realty', amountCents: -185000, daysAgo: 5 },
  { description: 'Spotify Premium', category: 'Subscriptions', counterparty: 'Spotify', amountCents: -1099, daysAgo: 8 },
  { description: 'Uber ride', category: 'Transport', counterparty: 'Uber', amountCents: -2340, daysAgo: 10 },
  { description: 'Refund — online order', category: 'Refund', counterparty: 'Amazon', amountCents: 4599, daysAgo: 12 },
  { description: 'Electric bill', category: 'Utilities', counterparty: 'ConEd', amountCents: -11245, daysAgo: 15 },
  { description: 'Coffee', category: 'Dining', counterparty: 'Blue Bottle', amountCents: -675, daysAgo: 16 },
]

const ADMIN_MERCHANTS = [
  { description: 'Wire credit — client escrow', category: 'Income', counterparty: 'First Meridian LLC', amountCents: 1250000 },
  { description: 'ACH payroll batch', category: 'Income', counterparty: 'DaddyG Enterprise', amountCents: 875000 },
  { description: 'Office lease', category: 'Housing', counterparty: 'Harbor Commercial', amountCents: -420000 },
  { description: 'Cloud infrastructure', category: 'Software', counterparty: 'AWS', amountCents: -48250 },
  { description: 'Legal retainer', category: 'Professional', counterparty: 'Northbridge Law', amountCents: -150000 },
  { description: 'Vendor payment', category: 'Operations', counterparty: 'SupplyLink Co', amountCents: -67340 },
  { description: 'Client refund', category: 'Refund', counterparty: 'Westbrook Media', amountCents: -22000 },
  { description: 'Interest credit', category: 'Income', counterparty: 'Apex Bank', amountCents: 1840 },
  { description: 'Corporate card settlement', category: 'Operations', counterparty: 'Visa Settlement', amountCents: -91220 },
  { description: 'Tax payment', category: 'Taxes', counterparty: 'IRS EFTPS', amountCents: -350000 },
  { description: 'Insurance premium', category: 'Insurance', counterparty: 'Hartford Business', amountCents: -18900 },
  { description: 'Equipment purchase', category: 'Operations', counterparty: 'Dell Business', amountCents: -245600 },
  { description: 'Consulting invoice paid', category: 'Income', counterparty: 'Summit Partners', amountCents: 640000 },
  { description: 'Software subscription', category: 'Software', counterparty: 'Microsoft 365', amountCents: -9900 },
  { description: 'Wire to savings reserve', category: 'Transfer', counterparty: 'High-Yield Savings', amountCents: -500000 },
]

type RecurringRule = {
  description: string
  category: string
  counterparty: string
  amountCents: number
  intervalDays: number
}

const ADMIN_RECURRING: RecurringRule[] = [
  { description: 'Recurring — ACH payroll', category: 'Income', counterparty: 'DaddyG Enterprise', amountCents: 875000, intervalDays: 14 },
  { description: 'Recurring — office lease', category: 'Housing', counterparty: 'Harbor Commercial', amountCents: -420000, intervalDays: 30 },
  { description: 'Recurring — cloud infrastructure', category: 'Software', counterparty: 'AWS', amountCents: -48250, intervalDays: 30 },
  { description: 'Recurring — Microsoft 365', category: 'Software', counterparty: 'Microsoft 365', amountCents: -9900, intervalDays: 30 },
  { description: 'Recurring — interest credit', category: 'Income', counterparty: 'Apex Bank', amountCents: 1840, intervalDays: 30 },
  { description: 'Recurring — insurance premium', category: 'Insurance', counterparty: 'Hartford Business', amountCents: -18900, intervalDays: 30 },
]

const MEMBER_RECURRING: RecurringRule[] = [
  { description: 'Recurring — payroll deposit', category: 'Income', counterparty: 'Acme Corp', amountCents: 420000, intervalDays: 14 },
  { description: 'Recurring — monthly rent', category: 'Housing', counterparty: 'Skyline Realty', amountCents: -185000, intervalDays: 30 },
  { description: 'Recurring — Spotify Premium', category: 'Subscriptions', counterparty: 'Spotify', amountCents: -1099, intervalDays: 30 },
  { description: 'Recurring — groceries', category: 'Groceries', counterparty: 'Whole Foods', amountCents: -8734, intervalDays: 7 },
]

function dateDaysAgo(days: number) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  d.setHours(12, 0, 0, 0)
  return d
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(12, 0, 0, 0)
  return d
}

function buildAdminSixMonthHistory() {
  const rows: Array<{
    description: string
    category: string
    counterparty: string
    amountCents: number
    createdAt: Date
  }> = []

  for (let day = 1; day <= 180; day += 3) {
    const template = ADMIN_MERCHANTS[day % ADMIN_MERCHANTS.length]
    const jitter = ((day * 37) % 7) * 100
    const signed =
      template.amountCents > 0
        ? template.amountCents + jitter
        : template.amountCents - jitter
    rows.push({
      ...template,
      amountCents: signed,
      createdAt: dateDaysAgo(day),
    })
  }

  return rows
}

async function applyAdminHistory(userId: string, checkingId: number) {
  const existingTx = await db
    .select({ id: transaction.id })
    .from(transaction)
    .where(and(eq(transaction.userId, userId), eq(transaction.accountId, checkingId)))

  if (existingTx.length >= 40) return

  const history = buildAdminSixMonthHistory()
  let checkingBalance = 0

  for (const t of history) {
    checkingBalance += t.amountCents
    await db.insert(transaction).values({
      userId,
      accountId: checkingId,
      amountCents: t.amountCents,
      type: t.amountCents >= 0 ? 'credit' : 'debit',
      description: t.description,
      category: t.category,
      counterparty: t.counterparty,
      createdAt: t.createdAt,
    })
  }

  if (checkingBalance < 50_000) {
    const topUp = 250_000 - checkingBalance
    checkingBalance += topUp
    await db.insert(transaction).values({
      userId,
      accountId: checkingId,
      amountCents: topUp,
      type: 'credit',
      description: 'Opening operating balance',
      category: 'Income',
      counterparty: 'Apex Bank',
      createdAt: dateDaysAgo(175),
    })
  }

  await db
    .update(bankAccount)
    .set({ balanceCents: checkingBalance })
    .where(and(eq(bankAccount.id, checkingId), eq(bankAccount.userId, userId)))
}

async function applyRecurringSeeds(
  userId: string,
  checkingId: number,
  rules: RecurringRule[]
) {
  const existing = await db
    .select({
      description: transaction.description,
      createdAt: transaction.createdAt,
    })
    .from(transaction)
    .where(and(eq(transaction.userId, userId), eq(transaction.accountId, checkingId)))
    .orderBy(desc(transaction.createdAt))

  const lastByDescription = new Map<string, Date>()
  for (const row of existing) {
    if (!lastByDescription.has(row.description)) {
      lastByDescription.set(row.description, new Date(row.createdAt))
    }
  }

  const today = startOfDay(new Date())
  let addedCents = 0
  let inserted = 0

  for (const rule of rules) {
    const last = lastByDescription.get(rule.description)
    let next = last ? addDays(last, rule.intervalDays) : dateDaysAgo(rule.intervalDays)

    while (next.getTime() <= today.getTime() && inserted < 80) {
      await db.insert(transaction).values({
        userId,
        accountId: checkingId,
        amountCents: rule.amountCents,
        type: rule.amountCents >= 0 ? 'credit' : 'debit',
        description: rule.description,
        category: rule.category,
        counterparty: rule.counterparty,
        createdAt: next,
      })
      addedCents += rule.amountCents
      inserted += 1
      lastByDescription.set(rule.description, next)
      next = addDays(next, rule.intervalDays)
    }
  }

  if (addedCents !== 0) {
    await db
      .update(bankAccount)
      .set({
        balanceCents: sql`${bankAccount.balanceCents} + ${addedCents}`,
      })
      .where(and(eq(bankAccount.id, checkingId), eq(bankAccount.userId, userId)))
  }
}

export async function ensureSeeded() {
  const user = await getSessionUser()
  const userId = user.id
  const isAdmin =
    String(user.email || '').trim().toLowerCase() === ADMIN_EMAIL

  let accounts = await db
    .select()
    .from(bankAccount)
    .where(eq(bankAccount.userId, userId))
    .orderBy(bankAccount.id)

  if (accounts.length === 0) {
    const [checking] = await db
      .insert(bankAccount)
      .values({
        userId,
        name: isAdmin ? 'Business Checking' : 'Everyday Checking',
        type: 'checking',
        accountNumber: SHARED_CHECKING_NUMBER,
        balanceCents: 0,
      })
      .returning()

    const savingsOpening = isAdmin ? 5_500_000 : 1_250_000

    await db.insert(bankAccount).values({
      userId,
      name: isAdmin ? 'Operating Reserve' : 'High-Yield Savings',
      type: 'savings',
      accountNumber: randomSavingsNumber(),
      balanceCents: savingsOpening,
    })

    if (isAdmin) {
      await applyAdminHistory(userId, checking.id)
    } else {
      let checkingBalance = 0
      for (const t of REGULAR_SEED_TX) {
        checkingBalance += t.amountCents
        await db.insert(transaction).values({
          userId,
          accountId: checking.id,
          amountCents: t.amountCents,
          type: t.amountCents >= 0 ? 'credit' : 'debit',
          description: t.description,
          category: t.category,
          counterparty: t.counterparty,
          createdAt: dateDaysAgo(t.daysAgo),
        })
      }
      await db
        .update(bankAccount)
        .set({ balanceCents: checkingBalance })
        .where(and(eq(bankAccount.id, checking.id), eq(bankAccount.userId, userId)))
    }

    accounts = await db
      .select()
      .from(bankAccount)
      .where(eq(bankAccount.userId, userId))
      .orderBy(bankAccount.id)
  }

  const checking = accounts.find((a) => a.type === 'checking') ?? accounts[0]
  const savings = accounts.find((a) => a.type === 'savings')

  await db
    .update(bankAccount)
    .set({
      accountNumber: SHARED_CHECKING_NUMBER,
      name: isAdmin ? 'Business Checking' : checking.name,
    })
    .where(and(eq(bankAccount.id, checking.id), eq(bankAccount.userId, userId)))

  if (savings && savings.accountNumber === SHARED_CHECKING_NUMBER) {
    await db
      .update(bankAccount)
      .set({ accountNumber: randomSavingsNumber() })
      .where(and(eq(bankAccount.id, savings.id), eq(bankAccount.userId, userId)))
  }

  if (isAdmin) {
    await applyAdminHistory(userId, checking.id)
    await applyRecurringSeeds(userId, checking.id, ADMIN_RECURRING)
  } else {
    await applyRecurringSeeds(userId, checking.id, MEMBER_RECURRING)
  }
}

export async function getAccounts() {
  const user = await getSessionUser()
  return db
    .select()
    .from(bankAccount)
    .where(eq(bankAccount.userId, user.id))
    .orderBy(bankAccount.id)
}

export async function getTransactions(limit = 100) {
  const user = await getSessionUser()
  return db
    .select()
    .from(transaction)
    .where(eq(transaction.userId, user.id))
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
  const user = await getSessionUser()
  const userId = user.id

  const { fromAccountId, toAccountId, amountDollars, note } = input

  if (fromAccountId === toAccountId) {
    return { ok: false, error: 'Choose two different accounts.' }
  }
  if (!Number.isFinite(amountDollars) || amountDollars <= 0) {
    return { ok: false, error: 'Enter a valid amount greater than zero.' }
  }

  const amountCents = Math.round(amountDollars * 100)

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

  const description = note?.trim() ? note.trim() : `Transfer to ${to.name}`

  await db
    .update(bankAccount)
    .set({ balanceCents: sql`${bankAccount.balanceCents} - ${amountCents}` })
    .where(and(eq(bankAccount.id, from.id), eq(bankAccount.userId, userId)))

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
