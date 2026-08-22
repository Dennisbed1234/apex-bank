import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bankAccount, transaction } from '@/lib/db/schema'
import { BANK_ADDRESS, ROUTING_NUMBER } from '@/lib/bank-constants'
import { buildStatementPdf } from '@/lib/pdf-statement'
import { formatCurrency, formatDate } from '@/lib/format'
import { and, asc, eq, gte } from 'drizzle-orm'

export const maxDuration = 60

export async function GET() {
  try {
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

    const since = new Date()
    since.setMonth(since.getMonth() - 12)
    since.setHours(0, 0, 0, 0)

    // Chronological 12-month activity from the real ledger
    const txs = await db
      .select()
      .from(transaction)
      .where(and(eq(transaction.userId, userId), gte(transaction.createdAt, since)))
      .orderBy(asc(transaction.createdAt), asc(transaction.id))

    const periodEnd = new Date()
    const periodLabel = `${since.toLocaleDateString('en-US')} - ${periodEnd.toLocaleDateString('en-US')}`

    const pdf = buildStatementPdf({
      memberName: session.user.name || 'Member',
      memberEmail: session.user.email || '',
      routingNumber: ROUTING_NUMBER,
      bankAddress: BANK_ADDRESS,
      periodLabel,
      accounts: accounts.map((a) => ({
        name: a.name,
        type: a.type,
        accountNumber: a.accountNumber,
        balanceLabel: formatCurrency(a.balanceCents, a.currency),
      })),
      transactions: txs.map((t) => ({
        date: formatDate(t.createdAt),
        description: `${t.description}${t.counterparty ? ` - ${t.counterparty}` : ''}`,
        amountLabel: formatCurrency(t.amountCents),
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
  } catch (err) {
    console.error('[statement] failed', err)
    return NextResponse.json(
      { error: 'Could not generate statement. Please try again.' },
      { status: 500 }
    )
  }
}
