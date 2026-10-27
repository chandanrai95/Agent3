'use client'
import React from "react"
import { toast } from "react-toastify"
import { deleteDocument } from "@/lib/api/documents"
import { errorMessage } from "@/lib/api/errors"
import { formatBytes } from "@/lib/utils/format"
import Icon from "../ui/icon"
import Spinner from "../ui/spinner"
import DocumentRow from "../documents/document-row"
import DropZone from "../documents/drop-zone"

type Props = {
  agentId: string
  documents: Source[]
  loading: boolean
  onClose: () => void
  onAdd: (files?: File[]) => void
  onDeleted: (sourceId: string) => void
}

const SourcesDrawer = ({ agentId, documents, loading, onClose, onAdd, onDeleted }: Props) => {
  const [query, setQuery] = React.useState('')
  const [deleting, setDeleting] = React.useState<string | null>(null)
  const filtered = documents.filter((d) => d.source_name.toLowerCase().includes(query.toLowerCase()))
  const totalSize = documents.reduce((n, d) => n + (d.size_bytes || 0), 0)

  const onDelete = async (doc: Source) => {
    try {
      setDeleting(doc._id)
      await deleteDocument({ agentId, sourceId: doc._id })
      onDeleted(doc._id)
      toast(`${doc.source_name} removed`, { type: 'success' })
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <aside className="fixed xl:static inset-y-0 right-0 z-40 w-[340px] max-w-[90vw] shrink-0 h-full bg-surface-container-low flex flex-col shadow-[-4px_0_16px_rgba(0,0,0,0.25)] xl:shadow-none">
      <div className="p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="menu_book" className="text-primary text-[20px]" />
          <div className="flex flex-col">
            <span className="text-label-md text-on-surface font-semibold">Knowledge Sources</span>
            <span className="text-label-sm text-outline">
              {documents.length} file{documents.length === 1 ? '' : 's'}{totalSize ? ` • ${formatBytes(totalSize)} total` : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onAdd()} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-container text-on-primary text-label-sm font-medium hover:bg-primary transition-colors">
            <Icon name="add" className="text-[16px]" />Add
          </button>
          <button type="button" aria-label="Close sources panel" onClick={onClose} className="xl:hidden p-1 rounded-lg text-outline hover:text-on-surface flex">
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="relative flex items-center">
          <Icon name="search" className="absolute left-2.5 text-[16px] text-outline pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter documents..."
            className="w-full bg-surface-container text-on-surface text-body-sm rounded-lg pl-8 pr-3 py-1.5 placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary-container"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-1.5">
        {loading && documents.length === 0 && <div className="flex justify-center py-6 text-outline"><Spinner /></div>}
        {!loading && documents.length === 0 && (
          <p className="text-body-sm text-outline px-1 py-2">No documents yet. Upload files so the agent has something to answer from.</p>
        )}
        {filtered.map((doc) => (
          <DocumentRow key={doc._id} doc={doc} compact onDelete={() => onDelete(doc)} deleting={deleting === doc._id} />
        ))}
      </div>

      <div className="p-4">
        <DropZone compact onFiles={(files) => onAdd(files)} />
      </div>
    </aside>
  )
}

export default SourcesDrawer
