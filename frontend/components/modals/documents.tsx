'use client'
import React from "react"
import { toast } from "react-toastify"
import useAppStore from "@/store/useAppStore"
import { deleteDocument, uploadDocument } from "@/lib/api/documents"
import { errorMessage } from "@/lib/api/errors"
import { fileIcon, formatBytes } from "@/lib/utils/format"
import Modal from "../ui/modal"
import Icon from "../ui/icon"
import Spinner from "../ui/spinner"
import { btnPrimary } from "../ui/styles"
import DropZone from "../documents/drop-zone"
import DocumentRow, { describeDocument } from "../documents/document-row"

type Upload = {
  id: string
  file: File
  status: 'queued' | 'uploading' | 'processing' | 'done' | 'failed'
  progress: number
  error?: string
  result?: Source
}

const DocumentsModal = ({ agentId, initialFiles }: { agentId: string, initialFiles?: File[] }) => {
  const { closeModal, agents, documents, documentsLoading, refreshDocuments } = useAppStore()
  const agent = agents.find((a) => a._id === agentId)
  const docs = documents[agentId] || []
  const [uploads, setUploads] = React.useState<Upload[]>([])
  const [deleting, setDeleting] = React.useState<string | null>(null)
  const running = React.useRef(false)
  const initialAdded = React.useRef(false)
  const aborts = React.useRef<Record<string, AbortController>>({})

  const patch = (id: string, change: Partial<Upload>) =>
    setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...change } : u)))

  const addFiles = React.useCallback((files: File[]) => {
    setUploads((list) => [
      ...list,
      ...files.map((file) => ({ id: `${file.name}-${file.size}-${Math.random()}`, file, status: 'queued' as const, progress: 0 })),
    ])
  }, [])

  React.useEffect(() => {
    refreshDocuments(agentId)
    // effects run twice in dev, don't queue the dropped files twice
    if (initialFiles?.length && !initialAdded.current) {
      initialAdded.current = true
      addFiles(initialFiles)
    }
  }, [agentId, initialFiles, addFiles, refreshDocuments])

  // one upload at a time: indexing is CPU/API heavy on the backend
  React.useEffect(() => {
    if (running.current) return
    const next = uploads.find((u) => u.status === 'queued')
    if (!next) return
    running.current = true
    const controller = new AbortController()
    aborts.current[next.id] = controller
    patch(next.id, { status: 'uploading', progress: 0 })

    uploadDocument({
      agentId,
      file: next.file,
      signal: controller.signal,
      onProgress: (progress) => patch(next.id, progress >= 100 ? { progress, status: 'processing' } : { progress }),
    })
      .then((result) => {
        patch(next.id, { status: 'done', result })
        refreshDocuments(agentId)
      })
      .catch((err) => {
        patch(next.id, { status: 'failed', error: controller.signal.aborted ? 'Cancelled' : errorMessage(err, 'Upload failed') })
      })
      .finally(() => {
        delete aborts.current[next.id]
        running.current = false
        setUploads((list) => [...list])
      })
  }, [uploads, agentId, refreshDocuments])

  const onDelete = async (doc: Source) => {
    try {
      setDeleting(doc._id)
      await deleteDocument({ agentId, sourceId: doc._id })
      await refreshDocuments(agentId)
      toast(`${doc.source_name} removed`, { type: 'success' })
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  const done = uploads.filter((u) => u.status === 'done').length
  const active = uploads.filter((u) => ['queued', 'uploading', 'processing'].includes(u.status)).length
  const failed = uploads.filter((u) => u.status === 'failed').length
  const totalChunks = docs.reduce((n, d) => n + (d.chunk_count || 0), 0)

  return (
    <Modal
      size="lg"
      icon="folder_managed"
      title="Knowledge Sources & Documents"
      subtitle={<><span className="text-on-surface-variant font-medium">{agent?.name || 'Agent'}</span> • Upload files to expand the agent&apos;s knowledge</>}
      onClose={closeModal}
      footer={
        <>
          <div className="flex items-center gap-1.5 text-body-sm text-outline">
            <Icon name="lock" className="text-[16px] text-rag-indexed" />
            Chunked and embedded with text-embedding-3-small
          </div>
          <button type="button" className={btnPrimary} onClick={closeModal} disabled={active > 0}>
            {active > 0 && <Spinner />}
            {active > 0 ? `Indexing ${active} file${active > 1 ? 's' : ''}...` : 'Done'}
          </button>
        </>
      }
    >
      <DropZone onFiles={addFiles} />

      {uploads.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-surface-container-lowest text-label-sm flex-wrap gap-2">
            <span className="text-on-surface font-medium uppercase tracking-wider">Uploads</span>
            <div className="flex items-center gap-3">
              {done > 0 && <span className="text-success flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success" />{done} completed</span>}
              {active > 0 && <span className="text-rag-syncing flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rag-syncing" />{active} in progress</span>}
              {failed > 0 && <span className="text-error flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-error" />{failed} failed</span>}
            </div>
          </div>

          {uploads.map((u) => {
            const icon = fileIcon(u.file.name)
            const busy = u.status === 'uploading' || u.status === 'processing'
            return (
              <div key={u.id} className={`flex flex-col gap-2 p-3 rounded-lg bg-surface-container border ${u.status === 'failed' ? 'border-error/20' : busy ? 'border-primary/20' : 'border-transparent'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 shrink-0 rounded-lg bg-surface-container-lowest flex items-center justify-center ${u.status === 'failed' ? 'text-error' : icon.color}`}>
                      <Icon name={u.status === 'failed' ? 'error' : icon.icon} className="text-[20px]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-label-md text-on-surface truncate font-medium">{u.file.name}</span>
                      <span className="text-body-sm text-outline truncate">
                        {u.status !== 'done' && `${formatBytes(u.file.size)} • `}
                        {u.status === 'queued' && 'Waiting...'}
                        {u.status === 'uploading' && <span className="text-rag-syncing">Uploading ({u.progress}%)</span>}
                        {u.status === 'processing' && <span className="text-rag-syncing">Reading, chunking &amp; embedding...</span>}
                        {u.status === 'done' && u.result && describeDocument(u.result)}
                        {u.status === 'failed' && <span className="text-error">{u.error}</span>}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {busy && <Spinner className="w-4 h-4 text-rag-syncing" />}
                    {u.status === 'done' && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-highest text-success text-label-sm">
                        <Icon name="check_circle" className="text-[14px]" />Indexed
                      </span>
                    )}
                    {u.status === 'failed' && u.error !== 'Cancelled' && (
                      <button type="button" onClick={() => patch(u.id, { status: 'queued', error: undefined })} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container-highest text-error hover:bg-error/20 text-label-sm transition-colors">
                        <Icon name="refresh" className="text-[14px]" />Retry
                      </button>
                    )}
                    {(u.status === 'queued' || u.status === 'uploading') && (
                      <button
                        type="button"
                        title="Cancel upload"
                        onClick={() => u.status === 'queued' ? setUploads((l) => l.filter((x) => x.id !== u.id)) : aborts.current[u.id]?.abort()}
                        className="w-8 h-8 rounded-lg text-outline hover:text-error hover:bg-surface-container-highest flex items-center justify-center"
                      >
                        <Icon name="close" className="text-[18px]" />
                      </button>
                    )}
                  </div>
                </div>
                {busy && (
                  <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                    {u.status === 'uploading'
                      ? <div className="h-full bg-gradient-to-r from-primary-container via-primary to-secondary rounded-full transition-all" style={{ width: `${u.progress}%` }} />
                      : <div className="h-full w-full shimmer-bar rounded-full" />}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-label-md text-on-surface uppercase tracking-wider">Indexed documents</span>
            <span className="px-1.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-label-sm">
              {docs.length} files • {totalChunks.toLocaleString()} chunks
            </span>
          </div>
          {documentsLoading[agentId] && <Spinner className="w-3.5 h-3.5 text-outline" />}
        </div>
        {docs.length === 0 && !documentsLoading[agentId] && (
          <p className="px-1 text-body-sm text-outline">No documents yet. The agent can&apos;t answer anything until you upload some.</p>
        )}
        {docs.map((doc) => (
          <DocumentRow key={doc._id} doc={doc} onDelete={() => onDelete(doc)} deleting={deleting === doc._id} />
        ))}
      </div>
    </Modal>
  )
}

export default DocumentsModal
