'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { ApexLogo } from '@/components/apex-logo'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function DashboardHeader({
  name,
  email,
}: {
  name: string
  email: string
}) {
  const router = useRouter()

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

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

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="h-9 gap-2 px-2">
                <Avatar className="size-7">
                  <AvatarFallback className="text-xs font-semibold">
                    {initials || <User />}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-foreground sm:inline">
                  {name}
                </span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="px-2 py-1.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
                <LogOut data-icon="inline-start" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
