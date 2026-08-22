'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { submitKyc, updatePhoneNumber } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SettingsForm({
  initialPhone,
  kyc,
}: {
  initialPhone: string
  kyc: {
    status: string
    idType: string
    ssnLast4: string
    submittedAt: string
  } | null
}) {
  const [phone, setPhone] = useState(initialPhone)
  const [ssn, setSsn] = useState('')
  const [idType, setIdType] = useState<'drivers_license' | 'state_id'>(
    'drivers_license'
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handlePhone(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await updatePhoneNumber(phone)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success('Phone number updated')
    })
  }

  function handleKyc(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('ssn', ssn)
    formData.set('idType', idType)

    startTransition(async () => {
      const result = await submitKyc(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success('KYC submitted for review')
      setSsn('')
      form.reset()
    })
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Phone number</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the U.S. mobile number on your Apex profile.
        </p>
        <form onSubmit={handlePhone} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              required
            />
          </div>
          <Button type="submit" disabled={isPending} className="w-fit">
            {isPending ? 'Saving…' : 'Save phone'}
          </Button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">KYC verification</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit your SSN and government ID (front &amp; back) for security verification.
        </p>

        {kyc && (
          <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium capitalize text-foreground">Status: {kyc.status}</p>
            <p className="text-muted-foreground">
              ID type: {kyc.idType === 'drivers_license' ? 'Driver license' : 'State ID'} ·
              SSN ending {kyc.ssnLast4}
            </p>
            <p className="text-xs text-muted-foreground">
              Submitted {new Date(kyc.submittedAt).toLocaleString()}
            </p>
          </div>
        )}

        <form onSubmit={handleKyc} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ssn">Social Security Number</Label>
            <Input
              id="ssn"
              name="ssn"
              inputMode="numeric"
              autoComplete="off"
              placeholder="XXX-XX-XXXX"
              value={ssn}
              onChange={(e) => setSsn(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="idType">ID type</Label>
            <select
              id="idType"
              name="idType"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={idType}
              onChange={(e) =>
                setIdType(e.target.value as 'drivers_license' | 'state_id')
              }
            >
              <option value="drivers_license">Driver license</option>
              <option value="state_id">State-issued ID</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="idFront">ID front image</Label>
            <Input
              id="idFront"
              name="idFront"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="idBack">ID back image</Label>
            <Input
              id="idBack"
              name="idBack"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              required
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-fit">
            {isPending ? 'Submitting…' : 'Submit KYC'}
          </Button>
        </form>
      </section>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
