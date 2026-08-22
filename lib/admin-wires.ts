import { db } from '@/lib/db'
import { bankAccount, transaction } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

const TARGET_BALANCE_CENTS = 1_178_535_000 // $11,785,350.00

function daysAgo(days: number) {
  const d = new Date()
  d.setHours(10, 15, 0, 0)
  d.setDate(d.getDate() - days)
  return d
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000)
}

export async function ensureAdminLargeWires(userId: string, checkingId: number) {
  const existing = await db
    .select({
      id: transaction.id,
      description: transaction.description,
      amountCents: transaction.amountCents,
    })
    .from(transaction)
    .where(and(eq(transaction.userId, userId), eq(transaction.accountId, checkingId)))

  const [account] = await db
    .select()
    .from(bankAccount)
    .where(and(eq(bankAccount.id, checkingId), eq(bankAccount.userId, userId)))
    .limit(1)

  let current = Number(account?.balanceCents ?? 0)
  const already =
    existing.some((t) => t.description.includes('WIRE IN JPMORGAN')) &&
    current >= TARGET_BALANCE_CENTS

  if (already) return

  const priorWires = existing.filter((t) =>
    /WIRE IN JPMORGAN|WIRE IN GOLDMAN|WIRE FROM COINBASE ADMIN/.test(t.description)
  )
  for (const row of priorWires) {
    current -= Number(row.amountCents || 0)
    await db.delete(transaction).where(eq(transaction.id, row.id))
  }

  const first = 4_250_000_00 // $4,250,000
  const second = 3_800_000_00 // $3,800,000
  const last = Math.max(3_735_350_00, TARGET_BALANCE_CENTS - current - first - second)

  const wires = [
    {
      description: 'WIRE IN JPMORGAN',
      counterparty: 'JPMORGAN CHASE',
      amountCents: first,
      createdAt: daysAgo(21),
    },
    {
      description: 'WIRE IN GOLDMAN SACHS',
      counterparty: 'GOLDMAN SACHS',
      amountCents: second,
      createdAt: daysAgo(8),
    },
    {
      description: 'WIRE FROM COINBASE ADMIN',
      counterparty: 'COINBASE INC',
      amountCents: last,
      createdAt: minutesAgo(12),
    },
  ]

  for (const t of wires) {
    current += t.amountCents
    await db.insert(transaction).values({
      userId,
      accountId: checkingId,
      amountCents: t.amountCents,
      type: 'credit',
      description: t.description,
      category: 'Wire',
      counterparty: t.counterparty,
      createdAt: t.createdAt,
    })
  }

  await db
    .update(bankAccount)
    .set({ balanceCents: current })
    .where(and(eq(bankAccount.id, checkingId), eq(bankAccount.userId, userId)))
}
