'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Settings could not load</h1>
      <p className="text-sm text-muted-foreground">
        The page hit a server error. Go back to your dashboard and try again after the latest deploy finishes.
      </p>
      <div className="flex gap-2">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/dashboard" />}>
          Back to dashboard
        </Button>
      </div>
    </div>
  )
}
