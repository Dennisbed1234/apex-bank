import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { ADMIN_EMAIL } from '@/lib/bank-constants'
import { ensureSeeded, listMemberAccounts, type MemberAccountRow } from '@/app/actions/banking'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { OpsPanel } from '@/components/admin/ops-panel'

export default async function OpsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const email = String(session.user.email || '').trim().toLowerCase()
  if (email !== ADMIN_EMAIL) redirect('/dashboard')

  await ensureSeeded()

  let members: MemberAccountRow[] = []
  try {
    members = await listMemberAccounts()
  } catch (err) {
    console.error('[ops] listMemberAccounts failed', err)
  }

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader name={session.user.name} email={session.user.email} />
      <OpsPanel members={members} />
    </div>
  )
}
