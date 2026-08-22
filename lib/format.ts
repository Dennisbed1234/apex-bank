import { ROUTING_NUMBER } from '@/lib/bank-constants'

export function formatCurrency(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

export function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(d)
}

export function transactionReference(id: number) {
  return `APX${String(id).padStart(10, '0')}`
}

export function maskAccountNumber(num: string) {
  return `•••• ${num.slice(-4)}`
}

export function formatRoutingNumber(routing = ROUTING_NUMBER) {
  return routing
}
