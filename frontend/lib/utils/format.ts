import type { IconName } from "@/components/ui/icon-names"

export const formatBytes = (bytes?: number | null) => {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const initials = (name?: string) =>
  (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

// the backend sends naive UTC datetimes ("2026-10-28T09:42:00"), read them as UTC
export const parseDate = (date: string | Date) =>
  date instanceof Date ? date : new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(date) ? date : `${date}Z`)

export const formatTime = (date?: string | Date) =>
  date ? new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(parseDate(date)) : ''

export const dayLabel = (date: string | Date) => {
  const d = parseDate(date)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 86400000)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
}

export const fileIcon = (name: string): { icon: IconName, color: string, label: string } => {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return { icon: 'picture_as_pdf', color: 'text-error', label: 'PDF' }
  if (ext === 'docx') return { icon: 'description', color: 'text-secondary', label: 'DOC' }
  if (ext === 'xlsx' || ext === 'csv') return { icon: 'table_chart', color: 'text-success', label: ext.toUpperCase() }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext || '')) return { icon: 'image', color: 'text-tertiary', label: 'IMG' }
  return { icon: 'article', color: 'text-outline', label: (ext || 'TXT').toUpperCase() }
}

export const ACCEPTED_FILES = '.pdf,.docx,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg,.webp,.gif'

export const timeAgo = (date: string | Date) => {
  const seconds = Math.max(0, (Date.now() - parseDate(date).getTime()) / 1000)
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)}d`
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(parseDate(date))
}

export const formatTokens = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n)
