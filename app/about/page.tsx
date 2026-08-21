import type { Metadata } from 'next'
import { SiteHeader } from '@/components/marketing/site-header'
import { CtaFooter } from '@/components/marketing/cta-footer'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export const metadata: Metadata = {
  title: 'About Us — Apex Bank',
  description:
    'Meet the team behind Apex Bank — building fee-free, high-yield banking for everyone.',
}

const team = [
  {
    name: 'Maria Chen',
    role: 'Founder & CEO',
    bio: 'Maria spent a decade in fintech before founding Apex Bank to make fee-free banking the default, not the exception.',
    initials: 'MC',
  },
  {
    name: 'David Okafor',
    role: 'Chief Technology Officer',
    bio: 'David leads engineering, focused on building banking infrastructure that is fast, secure, and simple.',
    initials: 'DO',
  },
  {
    name: 'Sofia Reyes',
    role: 'Chief Operating Officer',
    bio: 'Sofia oversees operations and compliance, ensuring every Apex member is protected and well served.',
    initials: 'SR',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            About Apex Bank
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            We started Apex Bank with a simple idea: banking should work as
            hard as you do, without fees getting in the way.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {team.map((person) => (
            <div
              key={person.name}
              className="flex flex-col items-center rounded-xl border border-border/60 bg-card p-6 text-center"
            >
              <Avatar className="size-20">
                <AvatarFallback className="text-lg font-semibold">
                  {person.initials}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                {person.name}
              </h2>
              <p className="text-sm font-medium text-primary">{person.role}</p>
              <p className="mt-2 text-sm text-muted-foreground">{person.bio}</p>
            </div>
          ))}
        </div>
      </main>
      <CtaFooter />
    </div>
  )
}
