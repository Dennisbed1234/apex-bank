import { Landmark, PiggyBank } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, maskAccountNumber } from '@/lib/format'
import { ROUTING_NUMBER } from '@/lib/bank-constants'
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
              Acct {maskAccountNumber(account.accountNumber)}
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
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-xs">
          <div>
            <p className="text-muted-foreground">Routing</p>
            <p className="font-medium tabular-nums text-foreground">{ROUTING_NUMBER}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Account</p>
            <p className="font-medium tabular-nums text-foreground">
              {account.accountNumber}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
