import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Receipt,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'
import type { BankAccount, Transaction } from '@/lib/db/schema'

function TransactionIcon({ type }: { type: string }) {
  if (type === 'credit') {
    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ArrowDownLeft className="size-4" />
      </div>
    )
  }
  if (type === 'transfer') {
    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-foreground">
        <ArrowRightLeft className="size-4" />
      </div>
    )
  }
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <ArrowUpRight className="size-4" />
    </div>
  )
}

export function TransactionsList({
  transactions,
  accounts,
}: {
  transactions: Transaction[]
  accounts: BankAccount[]
}) {
  const accountNameById = new Map(accounts.map((a) => [a.id, a.name]))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Receipt className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No transactions yet.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {transactions.map((t, i) => (
              <li key={t.id}>
                <div className="flex items-center gap-3 py-3">
                  <TransactionIcon type={t.type} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {t.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {accountNameById.get(t.accountId) ?? 'Account'} ·{' '}
                      {formatDate(t.createdAt)}
                    </p>
                  </div>
                  <p
                    className={
                      t.amountCents >= 0
                        ? 'text-sm font-semibold text-foreground'
                        : 'text-sm font-semibold text-muted-foreground'
                    }
                  >
                    {t.amountCents >= 0 ? '+' : ''}
                    {formatCurrency(t.amountCents)}
                  </p>
                </div>
                {i < transactions.length - 1 && (
                  <div className="h-px bg-border" />
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
