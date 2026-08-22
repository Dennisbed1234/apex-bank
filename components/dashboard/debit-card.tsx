'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Lock, ShieldCheck, Wifi } from 'lucide-react'
import { toast } from 'sonner'

function maskPan(accountNumber: string) {
  const last4 = accountNumber.replace(/\D/g, '').slice(-4).padStart(4, '0')
  return `4532  ••••  ••••  ${last4}`
}

export function DebitCard({
  memberName,
  accountNumber,
  kycStatus,
}: {
  memberName: string
  accountNumber: string
  kycStatus: string | null
}) {
  const router = useRouter()
  const [pressed, setPressed] = useState(false)
  const approved = kycStatus === 'approved'
  const pending = kycStatus === 'pending'

  function handleGetCard() {
    setPressed(true)
    if (approved) {
      toast.success('Debit card is ready', {
        description: 'Your Apex Debit Card is linked to Everyday Checking.',
      })
      setPressed(false)
      return
    }
    if (pending) {
      toast.message('KYC under review', {
        description: 'Finish verification is pending admin approval before your card can be issued.',
      })
      router.push('/dashboard/settings')
      return
    }
    toast.error('KYC required', {
      description: 'Verify your identity to get an Apex Debit Card.',
    })
    router.push('/dashboard/settings')
  }

  const displayName = (memberName || 'APEX MEMBER').toUpperCase()

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Debit card
          </p>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Apex Debit Card
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Instant virtual card tied to your checking account. Physical card ships after KYC.
          </p>
        </div>
        {approved ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <ShieldCheck className="size-3.5" />
            KYC verified · Card eligible
          </span>
        ) : pending ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700">
            <Lock className="size-3.5" />
            KYC pending review
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Lock className="size-3.5" />
            KYC required
          </span>
        )}
      </div>

      {/* Card face */}
      <div className="mt-5 flex justify-center">
        <div
          className="relative w-full max-w-[380px] overflow-hidden rounded-2xl p-5 text-white shadow-2xl"
          style={{
            aspectRatio: '1.586 / 1',
            background:
              'radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.18) 0%, transparent 45%), linear-gradient(135deg, #0b3d2e 0%, #145c43 42%, #1f7a56 72%, #0f2f24 100%)',
          }}
        >
          {/* Soft sheen */}
          <div
            className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 70%)',
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 left-10 h-44 w-44 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(180,255,210,0.5) 0%, transparent 70%)',
            }}
          />

          {/* Top row */}
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
                <span className="text-sm font-black tracking-tighter">A</span>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-white/90">
                  APEX BANK
                </p>
                <p className="text-[10px] text-white/65">DEBIT</p>
              </div>
            </div>
            <Wifi className="size-5 rotate-90 text-white/80" aria-hidden />
          </div>

          {/* Chip */}
          <div className="relative mt-5 flex items-center gap-3">
            <div
              className="h-9 w-12 rounded-md"
              style={{
                background:
                  'linear-gradient(145deg, #e8d5a3 0%, #c9a84c 40%, #f0e0b0 60%, #b8923a 100%)',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)',
              }}
            >
              <div className="grid h-full grid-cols-3 gap-px p-1 opacity-50">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-[1px] bg-black/20" />
                ))}
              </div>
            </div>
            <CreditCard className="size-5 text-white/50" />
          </div>

          {/* Number */}
          <p className="relative mt-5 font-mono text-lg tracking-[0.18em] text-white sm:text-xl">
            {maskPan(accountNumber)}
          </p>

          {/* Bottom */}
          <div className="relative mt-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-white/55">Cardholder</p>
              <p className="truncate text-sm font-semibold tracking-wide text-white">
                {displayName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-wider text-white/55">Valid thru</p>
              <p className="font-mono text-sm font-semibold text-white">12/29</p>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-[10px] font-bold italic tracking-wide text-white/90">VISA</p>
              <p className="text-[9px] text-white/55">Debit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={pressed}
          onClick={handleGetCard}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
        >
          <CreditCard className="size-4" />
          {approved ? 'Card activated' : 'Get Debit Card'}
        </button>
        {!approved && (
          <p className="text-center text-xs text-muted-foreground sm:max-w-[220px] sm:text-left">
            {pending
              ? 'Your KYC is under review. You will be able to issue the card after approval.'
              : 'You must complete KYC verification before a debit card can be issued.'}
          </p>
        )}
      </div>
    </section>
  )
}
