import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { ADMIN_EMAIL } from '@/lib/bank-constants'
import {
  ensureDemoMemberProfile,
  listKycSubmissions,
  listMemberAccounts,
  type KycAdminRow,
  type MemberAccountRow,
} from '@/app/actions/admin-ops'
import {
  listChatThreadsForAdmin,
  type ChatThreadView,
} from '@/app/actions/chat'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { OpsPanel } from '@/components/admin/ops-panel'
import { OpsChat } from '@/components/admin/ops-chat'

export const maxDuration = 60

export default async function OpsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const email = String(session.user.email || '').trim().toLowerCase()
  if (email !== ADMIN_EMAIL) redirect('/dashboard')

  // List members FIRST so seeding never blocks the member table
  let members: MemberAccountRow[] = []
  let kycRows: KycAdminRow[] = []
  let chatThreads: ChatThreadView[] = []

  try {
    members = await listMemberAccounts()
  } catch (err) {
    console.error('[ops] listMemberAccounts failed', err)
  }
  try {
    kycRows = await listKycSubmissions()
  } catch (err) {
    console.error('[ops] listKycSubmissions failed', err)
  }
  try {
    chatThreads = await listChatThreadsForAdmin()
  } catch (err) {
    console.error('[ops] listChatThreadsForAdmin failed', err)
  }

  // Seed demo history after listing (best-effort)
  try {
    await ensureDemoMemberProfile()
    // refresh members after seed so balances show
    members = await listMemberAccounts()
  } catch (err) {
    console.error('[ops] ensureDemoMemberProfile failed', err)
  }

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader
        name={session.user.name || 'Admin'}
        email={session.user.email || ADMIN_EMAIL}
      />
      <OpsPanel members={members} kycRows={kycRows} />
      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <OpsChat threads={chatThreads} />
      </div>
    </div>
  )
}
