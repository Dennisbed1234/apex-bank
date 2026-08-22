import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bankAccount, transaction } from '@/lib/db/schema'
import { ROUTING_NUMBER } from '@/lib/bank-constants'
import { buildStatementPdf } from '@/lib/pdf-statement'
import { formatCurrency, formatDate } from '@/lib/format'
import { and, desc, eq, gte } from 'drizzle-orm'

export const maxDuration = 60

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const accounts = await db
    .select()
    .from(bankAccount)
    .where(eq(bankAccount.userId, userId))
    .orderBy(bankAccount.id)

  const accountNameById = new Map(accounts.map((a) => [a.id, a.name]))

  const since = new Date()
  since.setMonth(since.getMonth() - 12)
  since.setHours(0, 0, 0, 0)

  // Full 12-month ledger activity for this member (matches dashboard history)
  const txs = await db
    .select()
    .from(transaction)
    .where(and(eq(transaction.userId, userId), gte(transaction.createdAt, since)))
    .orderBy(desc(transaction.createdAt), desc(transaction.id))

  const periodEnd = new Date()
  const periodLabel = `${since.toLocaleDateString('en-US')} – ${periodEnd.toLocaleDateString('en-US')}`

  const pdf = buildStatementPdf({
    memberName: session.user.name || 'Member',
    memberEmail: session.user.email || '',
    routingNumber: ROUTING_NUMBER,
    periodLabel,
    accounts: accounts.map((a) => ({
      name: a.name,
      type: a.type,
      accountNumber: a.accountNumber,
      balanceLabel: formatCurrency(a.balanceCents, a.currency),
    })),
    transactions: txs.map((t) => ({
      date: formatDate(t.createdAt),
      description: `${t.description}${t.counterparty ? ` · ${t.counterparty}` : ''}`,
      amountLabel: formatCurrency(t.amountCents),
      accountLabel: accountNameById.get(t.accountId),
    })),
    generatedAt: new Date().toLocaleString('en-US'),
  })

  const filename = `apex-12mo-statement-${new Date().toISOString().slice(0, 10)}.pdf`

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
