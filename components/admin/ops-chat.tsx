'use client'

import { useEffect, useState, useTransition } from 'react'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import {
  getThreadMessagesForAdmin,
  sendAdminChatReply,
  type ChatMessageView,
  type ChatThreadView,
} from '@/app/actions/chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function OpsChat({ threads }: { threads: ChatThreadView[] }) {
  const [selectedId, setSelectedId] = useState(threads[0]?.id ?? 0)
  const [messages, setMessages] = useState<ChatMessageView[]>([])
  const [reply, setReply] = useState('')
  const [isPending, startTransition] = useTransition()

  const selected = threads.find((t) => t.id === selectedId) ?? null

  async function loadMessages(id: number) {
    try {
      const msgs = await getThreadMessagesForAdmin(id)
      setMessages(msgs)
    } catch {
      setMessages([])
    }
  }

  useEffect(() => {
    if (!selectedId) return
    void loadMessages(selectedId)
    const id = setInterval(() => {
      void loadMessages(selectedId)
    }, 2000)
    return () => clearInterval(id)
  }, [selectedId])

  function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId || !reply.trim()) return
    startTransition(async () => {
      const result = await sendAdminChatReply(selectedId, reply)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setReply('')
      await loadMessages(selectedId)
      toast.success('Reply sent')
    })
  }

  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">Chat support inbox</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Near real-time inbox (2s refresh). Reply instantly to members.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-h-80 overflow-y-auto rounded-lg border border-border/70">
          {threads.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No chats yet.</p>
          )}
          {threads.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedId(t.id)}
              className={`flex w-full flex-col border-b border-border/60 px-3 py-3 text-left hover:bg-muted/40 ${
                selectedId === t.id ? 'bg-primary/5' : ''
              }`}
            >
              <span className="text-sm font-medium text-foreground">{t.memberName}</span>
              <span className="text-xs text-muted-foreground">{t.memberEmail}</span>
              <span className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {t.lastMessage || 'No messages'}
              </span>
            </button>
          ))}
        </div>

        <div className="flex h-80 flex-col rounded-lg border border-border/70">
          <div className="border-b border-border px-3 py-2 text-sm">
            {selected ? (
              <>
                <span className="font-medium">{selected.memberName}</span>
                <span className="text-muted-foreground"> · {selected.memberEmail}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Select a conversation</span>
            )}
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.sender === 'admin'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-[10px] uppercase opacity-70">{m.sender}</p>
                  <p>{m.body}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleReply} className="flex gap-2 border-t border-border p-3">
            <Input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply as admin…"
              disabled={!selected || isPending}
            />
            <Button type="submit" size="icon" disabled={!selected || isPending || !reply.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}
