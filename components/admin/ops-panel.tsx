'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { toast } from 'sonner'
import { adminSendToUser } from '@/app/actions/banking'
import type { MemberAccountRow } from '@/app/actions/admin-ops'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, maskAccountNumber } from '@/lib/format'
import { ROUTING_NUMBER } from '@/lib/bank-constants'

export function OpsPanel({ members }: { members: MemberAccountRow[] }) {
  const [selectedUserId, setSelectedUserId] = useState(members[0]?.userId ?? '')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selected = useMemo(
    () => members.find((m) => m.userId === selectedUserId) ?? null,
    [members, selectedUserId]
  )

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!selectedUserId) {
      setError('Select a member account.')
      return
    }
    const amountDollars = Number.parseFloat(amount)
    startTransition(async () => {
      const result = await adminSendToUser({
        targetUserId: selectedUserId,
        amountDollars,
        note,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success('Money sent', {
        description: `${formatCurrency(Math.round(amountDollars * 100))} credited to member checking.`,
      })
      setAmount('')
      setNote('')
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Restricted · DaddyG Enterprise
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Operations desk
          </h1>
          <p className="text-sm text-muted-foreground">
            View member accounts and fund checking balances. Routing {ROUTING_NUMBER}.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          Open my user dashboard
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Member accounts</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {members.length} registered member{members.length === 1 ? '' : 's'}
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-medium">Member</th>
                  <th className="py-2 pr-3 font-medium">Checking</th>
                  <th className="py-2 pr-3 font-medium">Balance</th>
                  <th className="py-2 font-medium">Savings</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      No member accounts yet.
                    </td>
                  </tr>
                )}
                {members.map((m) => (
                  <tr
                    key={m.userId}
                    className={`border-b border-border/60 ${
                      selectedUserId === m.userId ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => setSelectedUserId(m.userId)}
                      >
                        <div className="font-medium text-foreground">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </button>
                    </td>
                    <td className="py-3 pr-3 tabular-nums text-muted-foreground">
                      {m.checkingNumber
                        ? maskAccountNumber(m.checkingNumber)
                        : '—'}
                    </td>
                    <td className="py-3 pr-3 font-medium tabular-nums">
                      {formatCurrency(m.checkingBalanceCents)}
                    </td>
                    <td className="py-3 tabular-nums text-muted-foreground">
                      {formatCurrency(m.savingsBalanceCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Send money to member</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Credits the member's checking account. Debits your Business Checking when funds are available.
          </p>

          <form onSubmit={handleSend} className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="member">Member</Label>
              <select
                id="member"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                {members.length === 0 && <option value="">No members</option>}
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name} · {m.email}
                  </option>
                ))}
              </select>
            </div>

            {selected && (
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <p>
                  Checking {selected.checkingNumber ?? 'pending'} ·{' '}
                  {formatCurrency(selected.checkingBalanceCents)}
                </p>
                <p className="mt-1">Routing {ROUTING_NUMBER}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                placeholder="e.g. Welcome funding"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={isPending || members.length === 0}>
              <Send className="size-4" />
              {isPending ? 'Sending…' : 'Send to checking'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  )
}
