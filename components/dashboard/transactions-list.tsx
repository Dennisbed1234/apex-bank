'use client'

import { useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Receipt,
  X,
  Copy,
  Check,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  transactionReference,
} from '@/lib/format'

export type TxRow = {
  id: number
  accountId: number
  amountCents: number
  type: string
  description: string
  category: string | null
  counterparty: string | null
  createdAt: string
  accountName: string
}

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

function DetailRow({
  label,
  value,
  copyable,
}: {
  label: string
  value: string
  copyable?: boolean
}) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-3 last:border-0">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-foreground break-all">{value}</p>
      </div>
      {copyable && (
        <button
          type="button"
          className="mt-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={async () => {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1200)
          }}
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      )}
    </div>
  )
}

export function TransactionsList({
  transactions,
}: {
  transactions: TxRow[]
}) {
  const [open, setOpen] = useState<TxRow | null>(null)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Receipt className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {transactions.map((t, i) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(t)}
                    className="flex w-full items-center gap-3 py-3 text-left hover:bg-muted/40"
                  >
                    <TransactionIcon type={t.type} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {t.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.accountName} · {formatDate(t.createdAt)}
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
                  </button>
                  {i < transactions.length - 1 && <div className="h-px bg-border" />}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-background p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Transaction details
                </p>
                <h2 className="mt-1 text-lg font-bold text-foreground">{open.description}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="rounded-md p-1 hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <p
              className={`mt-4 text-2xl font-bold ${
                open.amountCents >= 0 ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {open.amountCents >= 0 ? '+' : ''}
              {formatCurrency(open.amountCents)}
            </p>

            <div className="mt-4">
              <DetailRow label="Reference number" value={transactionReference(open.id)} copyable />
              <DetailRow label="Timestamp" value={formatDateTime(open.createdAt)} />
              <DetailRow label="Status" value="Posted" />
              <DetailRow label="Type" value={open.type} />
              <DetailRow label="Account" value={open.accountName} />
              {open.counterparty && (
                <DetailRow label="Counterparty" value={open.counterparty} />
              )}
              {open.category && <DetailRow label="Category" value={open.category} />}
              <DetailRow label="Transaction ID" value={String(open.id)} copyable />
            </div>

            <button
              type="button"
              onClick={() => setOpen(null)}
              className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
