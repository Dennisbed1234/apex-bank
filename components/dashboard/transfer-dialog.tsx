'use client'

import { useState, useTransition } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner'
import { transferFunds } from '@/app/actions/banking'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { formatCurrency, maskAccountNumber } from '@/lib/format'
import type { BankAccount } from '@/lib/db/schema'

export function TransferDialog({ accounts }: { accounts: BankAccount[] }) {
  const [open, setOpen] = useState(false)
  const [fromId, setFromId] = useState<string>(String(accounts[0]?.id ?? ''))
  const [toId, setToId] = useState<string>(String(accounts[1]?.id ?? ''))
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function resetForm() {
    setAmount('')
    setNote('')
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const amountDollars = Number.parseFloat(amount)

    startTransition(async () => {
      const result = await transferFunds({
        fromAccountId: Number(fromId),
        toAccountId: Number(toId),
        amountDollars,
        note,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      toast.success('Transfer complete', {
        description: `${formatCurrency(Math.round(amountDollars * 100))} moved successfully.`,
      })
      resetForm()
      setOpen(false)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetForm()
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <ArrowRightLeft data-icon="inline-start" />
            Transfer money
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer between accounts</DialogTitle>
          <DialogDescription>
            Move money instantly between your Apex Bank accounts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel>From</FieldLabel>
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name} · {maskAccountNumber(a.accountNumber)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>To</FieldLabel>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name} · {maskAccountNumber(a.accountNumber)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="amount">Amount</FieldLabel>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="note">Note (optional)</FieldLabel>
              <Input
                id="note"
                placeholder="e.g. Move to savings"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
          </FieldGroup>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Transferring…' : 'Confirm transfer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
