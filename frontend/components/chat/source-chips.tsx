import { fileIcon } from "@/lib/utils/format"
import Icon from "../ui/icon"

const TYPE_LABELS: Record<string, string> = { table: 'Table', image: 'Image', scanned_page: 'Scanned page', text: 'Text' }

const SourceChips = ({ sources }: { sources: SourceRef[] }) => (
  <div className="flex items-center gap-2 flex-wrap">
    {sources.map((s, i) => {
      const icon = fileIcon(s.source_name)
      return (
        <div key={`${s.source_id}-${i}`} className="group relative inline-flex">
          <button
            type="button"
            className="flex items-center gap-1.5 max-w-[320px] px-3 py-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-primary text-label-sm shadow-sm transition-colors"
          >
            <span className="font-mono text-[10px] font-semibold">{i + 1}</span>
            <Icon name={icon.icon} className={`text-[14px] ${icon.color}`} />
            <span className="truncate">{s.source_name}</span>
            {!!s.pages?.length && <span className="text-outline shrink-0">p. {s.pages.join(', ')}</span>}
          </button>
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:flex group-focus-within:flex flex-col w-[min(24rem,80vw)] p-4 rounded-xl bg-surface-container-highest text-on-surface shadow-2xl z-40">
            <div className="flex items-center justify-between gap-2 pb-1.5">
              <span className="text-label-sm uppercase font-semibold text-primary truncate">
                {TYPE_LABELS[s.content_type || 'text'] || 'Text'}{s.page ? ` · p.${s.page}` : ''}
              </span>
              {s.score != null && <span className="font-mono text-code text-outline shrink-0">{Math.round(s.score * 100)}% match</span>}
            </div>
            {s.section && <span className="text-label-sm text-on-surface-variant pb-1.5 truncate">§ {s.section}</span>}
            <div className="bg-surface-container-lowest p-3 rounded-lg font-mono text-code text-on-surface-variant leading-normal whitespace-pre-wrap max-h-48 overflow-hidden">
              {s.snippet}…
            </div>
          </div>
        </div>
      )
    })}
  </div>
)

export default SourceChips
