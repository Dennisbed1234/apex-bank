'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApexLogo } from '@/components/apex-logo'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? 'Something went wrong. Please try again.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <ApexLogo className="h-7 w-7 text-sidebar-primary" />
          <span className="text-lg font-bold tracking-tight">Apex Bank</span>
        </Link>
        <div className="max-w-sm">
          <p className="text-balance text-2xl font-semibold leading-snug">
            &ldquo;Switching to Apex was the easiest financial decision I&apos;ve
            ever made.&rdquo;
          </p>
          <p className="mt-4 text-sm text-sidebar-foreground/70">
            — A very satisfied (fictional) member
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/60">
          Member FDIC · Deposits insured up to $250,000
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 flex items-center gap-2 lg:hidden"
          >
            <ApexLogo className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Apex Bank
            </span>
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isSignUp ? 'Open your account' : 'Welcome back'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignUp
                ? 'Get started with fee-free banking in minutes.'
                : 'Log in to access your accounts.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Jordan Lee"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder={isSignUp ? 'At least 8 characters' : '••••••••'}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full text-base"
            >
              {loading
                ? 'Please wait…'
                : isSignUp
                  ? 'Create account'
                  : 'Log in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <Link
              href={isSignUp ? '/sign-in' : '/sign-up'}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {isSignUp ? 'Log in' : 'Open one'}
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
