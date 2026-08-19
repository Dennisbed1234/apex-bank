import { Landmark, PiggyBank } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, maskAccountNumber } from '@/lib/format'
import type { BankAccount } from '@/lib/db/schema'

export function AccountCard({ account }: { account: BankAccount }) {
  const isSavings = account.type === 'savings'

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={
              isSavings
                ? 'flex size-10 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground'
                : 'flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary'
            }
          >
            {isSavings ? (
              <PiggyBank className="size-5" />
            ) : (
              <Landmark className="size-5" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {account.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {maskAccountNumber(account.accountNumber)}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="capitalize">
          {account.type}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">Available balance</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          {formatCurrency(account.balanceCents, account.currency)}
        </p>
      </CardContent>
    </Card>
  )
}
