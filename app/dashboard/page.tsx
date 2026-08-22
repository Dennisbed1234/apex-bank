import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { ensureSeeded, getAccounts, getTransactions } from '@/app/actions/banking'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { AccountCard } from '@/components/dashboard/account-card'
import { TransferDialog } from '@/components/dashboard/transfer-dialog'
import { TransactionsList } from '@/components/dashboard/transactions-list'

export const maxDuration = 60

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  await ensureSeeded()
  const [accounts, transactions] = await Promise.all([
    getAccounts(),
    getTransactions(250),
  ])

  const firstName = session.user.name?.split(' ')[0] || 'there'

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader name={session.user.name} email={session.user.email} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening with your money.
            </p>
          </div>
          {accounts.length >= 2 && <TransferDialog accounts={accounts} />}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>

        <div className="mt-8">
          <TransactionsList transactions={transactions} accounts={accounts} />
        </div>
      </main>
    </div>
  )
}
