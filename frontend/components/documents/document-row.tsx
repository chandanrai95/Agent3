import { fileIcon, formatBytes } from "@/lib/utils/format"
import Icon from "../ui/icon"
import Spinner from "../ui/spinner"

const STAT_LABELS: Record<string, string> = { table: 'tables', image: 'images', scanned_page: 'scanned pages' }

// "342 chunks • 12 tables • 3 images"
export const describeDocument = (doc: Source) => [
  formatBytes(doc.size_bytes),
  doc.chunk_count != null ? `${doc.chunk_count} chunks` : null,
  ...Object.entries(doc.content_stats || {})
    .filter(([kind]) => STAT_LABELS[kind])
    .map(([kind, n]) => `${n} ${STAT_LABELS[kind]}`),
].filter(Boolean).join(' • ')

type Props = {
  doc: Source
  onDelete?: () => void
  deleting?: boolean
  compact?: boolean
}

const DocumentRow = ({ doc, onDelete, deleting, compact }: Props) => {
  const icon = fileIcon(doc.source_name)
  return (
    <div className={`group flex items-center justify-between gap-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors ${compact ? 'p-2.5' : 'p-3'}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 shrink-0 rounded-lg bg-surface-container-lowest flex items-center justify-center ${icon.color}`}>
          <Icon name={icon.icon} className="text-[20px]" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-label-md text-on-surface truncate" title={doc.source_name}>{doc.source_name}</span>
          <span className="text-body-sm text-outline truncate">{describeDocument(doc)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!compact && (
          <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-highest text-success text-label-sm">
            <Icon name="check_circle" className="text-[14px]" />
            Indexed
          </span>
        )}
        {onDelete && (
          <button
            type="button"
            title="Delete document"
            aria-label={`Delete ${doc.source_name}`}
            onClick={onDelete}
            disabled={deleting}
            className={`w-8 h-8 rounded-lg text-outline hover:text-error hover:bg-surface-container-highest flex items-center justify-center transition-all ${compact ? 'opacity-0 group-hover:opacity-100 focus:opacity-100' : ''} ${deleting ? 'opacity-100' : ''}`}
          >
            {deleting ? <Spinner /> : <Icon name="delete" className="text-[18px]" />}
          </button>
        )}
      </div>
    </div>
  )
}

export default DocumentRow
