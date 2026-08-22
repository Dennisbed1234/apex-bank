import { db } from '@/lib/db'
import { bankAccount, transaction } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

function dateDaysAgo(days: number) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d
}

const PERSONAL_MERCHANTS = [
  { description: 'Payroll deposit', category: 'Income', counterparty: 'Northline Staffing', amountCents: 318500 },
  { description: 'Whole Foods Market', category: 'Groceries', counterparty: 'Whole Foods', amountCents: -8724 },
  { description: 'Monthly rent', category: 'Housing', counterparty: 'Harbor Court Apts', amountCents: -185000 },
  { description: 'Spotify Premium', category: 'Subscriptions', counterparty: 'Spotify', amountCents: -1099 },
  { description: 'Uber ride', category: 'Transport', counterparty: 'Uber', amountCents: -2140 },
  { description: 'Amazon order', category: 'Shopping', counterparty: 'Amazon', amountCents: -5640 },
  { description: 'Electric bill', category: 'Utilities', counterparty: 'ConEd', amountCents: -11890 },
  { description: 'Coffee', category: 'Dining', counterparty: 'Blue Bottle', amountCents: -675 },
  { description: 'Refund — online order', category: 'Refund', counterparty: 'Amazon', amountCents: 4599 },
  { description: 'Shell gas station', category: 'Transport', counterparty: 'Shell', amountCents: -4820 },
  { description: 'Netflix', category: 'Subscriptions', counterparty: 'Netflix', amountCents: -1599 },
  { description: 'Pharmacy', category: 'Health', counterparty: 'CVS', amountCents: -2360 },
  { description: 'ATM cash withdrawal', category: 'Cash', counterparty: 'Apex ATM', amountCents: -8000 },
  { description: 'Interest credit', category: 'Income', counterparty: 'Apex Bank', amountCents: 126 },
]

export function buildTwoYearPersonalHistory() {
  const rows: Array<{
    description: string
    category: string
    counterparty: string
    amountCents: number
    createdAt: Date
  }> = []

  for (let day = 1; day <= 730; day += 3) {
    const template = PERSONAL_MERCHANTS[day % PERSONAL_MERCHANTS.length]
    const jitter = ((day * 41) % 9) * 80
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

export async function applyTwoYearPersonalHistory(
  userId: string,
  checkingId: number
) {
  const existingTx = await db
    .select({ id: transaction.id })
    .from(transaction)
    .where(and(eq(transaction.userId, userId), eq(transaction.accountId, checkingId)))

  if (existingTx.length >= 180) return

  const history = buildTwoYearPersonalHistory()
  let checkingBalance = 0

  await db.insert(transaction).values(
    history.map((t) => {
      checkingBalance += t.amountCents
      return {
        userId,
        accountId: checkingId,
        amountCents: t.amountCents,
        type: t.amountCents >= 0 ? 'credit' : 'debit',
        description: t.description,
        category: t.category,
        counterparty: t.counterparty,
        createdAt: t.createdAt,
      }
    })
  )

  if (checkingBalance < 50_000) {
    const topUp = 250_000 - checkingBalance
    checkingBalance += topUp
    await db.insert(transaction).values({
      userId,
      accountId: checkingId,
      amountCents: topUp,
      type: 'credit',
      description: 'Opening deposit',
      category: 'Income',
      counterparty: 'Apex Bank',
      createdAt: dateDaysAgo(720),
    })
  }

  await db
    .update(bankAccount)
    .set({ balanceCents: checkingBalance })
    .where(and(eq(bankAccount.id, checkingId), eq(bankAccount.userId, userId)))
}
