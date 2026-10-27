import { formatTokens } from "@/lib/utils/format"

// free tier bar: green, amber from 75%, red when exhausted
const UsageMeter = ({ usage, compact }: { usage: Usage, compact?: boolean }) => {
  if (usage.limit === null) return null
  const used = usage.free_tokens_used
  const ratio = Math.min(1, used / usage.limit)
  const color = ratio >= 1 ? 'bg-error' : ratio >= 0.75 ? 'bg-rag-syncing' : 'bg-rag-indexed'
  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-center justify-between ${compact ? 'text-label-sm' : 'text-label-md'}`}>
        <span className="text-on-surface-variant">{compact ? 'Free tokens' : 'Free tokens used'}</span>
        <span className={`font-mono ${ratio >= 1 ? 'text-error' : 'text-on-surface'}`}>
          {formatTokens(used)} / {formatTokens(usage.limit)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={usage.limit}
        aria-valuenow={used}
        aria-label="Free token usage"
        className={`w-full ${compact ? 'h-1' : 'h-2'} rounded-full bg-surface-container-highest overflow-hidden`}
      >
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.max(ratio * 100, ratio > 0 ? 2 : 0)}%` }} />
      </div>
    </div>
  )
}

export default UsageMeter
