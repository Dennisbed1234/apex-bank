import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bankAccount, transaction } from '@/lib/db/schema'
import { ROUTING_NUMBER } from '@/lib/bank-constants'
import { buildStatementPdf } from '@/lib/pdf-statement'
import { formatCurrency, formatDate } from '@/lib/format'
import { desc, eq } from 'drizzle-orm'

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

  const txs = await db
    .select()
    .from(transaction)
    .where(eq(transaction.userId, userId))
    .orderBy(desc(transaction.createdAt), desc(transaction.id))
    .limit(200)

  const pdf = buildStatementPdf({
    memberName: session.user.name || 'Member',
    memberEmail: session.user.email || '',
    routingNumber: ROUTING_NUMBER,
    accounts: accounts.map((a) => ({
      name: a.name,
      type: a.type,
      accountNumber: a.accountNumber,
      balanceLabel: formatCurrency(a.balanceCents, a.currency),
    })),
    transactions: txs.map((t) => ({
      date: formatDate(t.createdAt),
      description: t.description,
      amountLabel: formatCurrency(t.amountCents),
    })),
    generatedAt: new Date().toLocaleString('en-US'),
  })

  const filename = `apex-statement-${new Date().toISOString().slice(0, 10)}.pdf`

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
