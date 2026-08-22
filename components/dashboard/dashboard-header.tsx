'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, LogOut, Settings, Shield, User } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { ApexLogo } from '@/components/apex-logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ADMIN_EMAIL } from '@/lib/bank-constants'

export function DashboardHeader({
  name,
  email,
}: {
  name: string
  email: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const safeName = name?.trim() || 'Account'
  const safeEmail = email?.trim() || ''
  const isAdmin = safeEmail.toLowerCase() === ADMIN_EMAIL

  const initials = safeName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ApexLogo className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            Apex Bank
          </span>
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 items-center gap-2 rounded-md px-2 hover:bg-accent"
          >
            <Avatar className="size-7">
              <AvatarFallback className="text-xs font-semibold">
                {initials || <User />}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium text-foreground sm:inline">
              {safeName}
            </span>
          </button>

          {open && (
            <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
              <div className="px-2 py-1.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{safeName}</span>
                  <span className="truncate text-xs text-muted-foreground">{safeEmail}</span>
                </div>
              </div>
              <div className="my-1 h-px bg-border" />
              <Link
                href="/dashboard/settings"
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                <Settings className="size-4" />
                Settings
              </Link>
              <a
                href="/api/statement"
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                <FileText className="size-4" />
                12-month statement (PDF)
              </a>
              {isAdmin && (
                <Link
                  href="/ops"
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  <Shield className="size-4" />
                  Operations desk
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
