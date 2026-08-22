import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { ADMIN_EMAIL } from '@/lib/bank-constants'
import {
  ensureDemoMemberProfile,
  listMemberAccounts,
  type MemberAccountRow,
} from '@/app/actions/admin-ops'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { OpsPanel } from '@/components/admin/ops-panel'

export default async function OpsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const email = String(session.user.email || '').trim().toLowerCase()
  if (email !== ADMIN_EMAIL) redirect('/dashboard')

  try {
    await ensureDemoMemberProfile()
  } catch (err) {
    console.error('[ops] ensureDemoMemberProfile failed', err)
  }

  let members: MemberAccountRow[] = []
  try {
    members = await listMemberAccounts()
  } catch (err) {
    console.error('[ops] listMemberAccounts failed', err)
  }

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader
        name={session.user.name || 'Admin'}
        email={session.user.email || ADMIN_EMAIL}
      />
      <OpsPanel members={members} />
    </div>
  )
}
