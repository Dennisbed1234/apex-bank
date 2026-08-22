'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Lock, ShieldCheck, Wifi } from 'lucide-react'
import { toast } from 'sonner'

function maskPan(accountNumber: string) {
  const last4 = accountNumber.replace(/\D/g, '').slice(-4).padStart(4, '0')
  return `4532  ••••  ••••  ${last4}`
}

const DESIGNS = [
  {
    id: 'forest',
    name: 'Forest',
    finish: 'Matte metal',
    text: 'text-white',
    muted: 'text-white/60',
    bg: 'radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.18) 0%, transparent 45%), linear-gradient(135deg, #0b3d2e 0%, #145c43 42%, #1f7a56 72%, #0f2f24 100%)',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    finish: 'Gloss black',
    text: 'text-white',
    muted: 'text-white/60',
    bg: 'radial-gradient(90% 70% at 100% 0%, rgba(90,120,255,0.25) 0%, transparent 50%), linear-gradient(160deg, #0a0a0c 0%, #1a1d24 55%, #0d1117 100%)',
  },
  {
    id: 'champagne',
    name: 'Champagne',
    finish: 'Brushed gold',
    text: 'text-[#2a2114]',
    muted: 'text-[#2a2114]/60',
    bg: 'radial-gradient(80% 60% at 10% 0%, rgba(255,255,255,0.35) 0%, transparent 50%), linear-gradient(135deg, #f3e2b8 0%, #d4b06a 45%, #c49a4a 70%, #e8d39a 100%)',
  },
  {
    id: 'ivory',
    name: 'Ivory',
    finish: 'Ceramic white',
    text: 'text-[#163228]',
    muted: 'text-[#163228]/55',
    bg: 'radial-gradient(70% 50% at 90% 10%, rgba(31,122,86,0.16) 0%, transparent 55%), linear-gradient(145deg, #f7f4ee 0%, #ebe4d6 50%, #f3efe6 100%)',
  },
] as const

function CardFace({
  design,
  memberName,
  accountNumber,
}: {
  design: (typeof DESIGNS)[number]
  memberName: string
  accountNumber: string
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl p-5 shadow-2xl ${design.text}`}
      style={{ aspectRatio: '1.586 / 1', background: design.bg }}
    >
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-black/10 ring-1 ring-black/10">
            <span className="text-sm font-black tracking-tighter">A</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em]">APEX BANK</p>
            <p className={`text-[10px] ${design.muted}`}>PHYSICAL DEBIT</p>
          </div>
        </div>
        <Wifi className={`size-5 rotate-90 ${design.muted}`} aria-hidden />
      </div>

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
        <CreditCard className={`size-5 ${design.muted}`} />
      </div>

      <p className="relative mt-5 font-mono text-lg tracking-[0.16em] sm:text-xl">
        {maskPan(accountNumber)}
      </p>

      <div className="relative mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[9px] uppercase tracking-wider ${design.muted}`}>Cardholder</p>
          <p className="truncate text-sm font-semibold tracking-wide">{memberName}</p>
        </div>
        <div className="text-right">
          <p className={`text-[9px] uppercase tracking-wider ${design.muted}`}>Valid thru</p>
          <p className="font-mono text-sm font-semibold">12/29</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold italic tracking-wide">VISA</p>
          <p className={`text-[9px] ${design.muted}`}>Debit</p>
        </div>
      </div>
    </div>
  )
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
  const [selected, setSelected] = useState<(typeof DESIGNS)[number]['id']>('forest')
  const approved = kycStatus === 'approved'
  const pending = kycStatus === 'pending'
  const design = DESIGNS.find((d) => d.id === selected) ?? DESIGNS[0]
  const displayName = (memberName || 'APEX MEMBER').toUpperCase()

  function requireKyc(action: string) {
    if (approved) {
      toast.success(`${action} requested`, {
        description: `${design.name} physical card will ship after production.`,
      })
      return
    }
    if (pending) {
      toast.message('KYC under review', {
        description: 'Admin must approve your verification before a physical card can ship.',
      })
    } else {
      toast.error('KYC required', {
        description: 'Verify your identity to order a physical Apex Debit Card.',
      })
    }
    router.push('/dashboard/settings')
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Physical cards
          </p>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Choose your Apex card
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Four finishes. Same checking account. Ships only after KYC approval.
          </p>
        </div>
        {approved ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <ShieldCheck className="size-3.5" />
            KYC verified
          </span>
        ) : pending ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700">
            <Lock className="size-3.5" />
            KYC pending
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Lock className="size-3.5" />
            KYC required
          </span>
        )}
      </div>

      <div className="mt-5 flex justify-center">
        <div className="w-full max-w-[380px]">
          <CardFace design={design} memberName={displayName} accountNumber={accountNumber} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {DESIGNS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSelected(option.id)}
            className={`rounded-xl border p-2 text-left transition ${
              selected === option.id
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border hover:border-foreground/20'
            }`}
          >
            <div
              className="h-14 w-full rounded-lg"
              style={{ background: option.bg }}
            />
            <p className="mt-2 text-sm font-semibold text-foreground">{option.name}</p>
            <p className="text-[11px] text-muted-foreground">{option.finish}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => requireKyc('Get Debit Card')}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <CreditCard className="size-4" />
          Get Debit Card
        </button>
        <button
          type="button"
          onClick={() => requireKyc(`Order ${design.name}`)}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Order {design.name} physical card
        </button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Selecting a design is free. Issuing a physical card requires completed KYC on this website.
      </p>
    </section>
  )
}
