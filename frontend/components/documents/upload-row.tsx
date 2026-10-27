'use client'
import useUploadStore, { Upload } from "@/store/useUploadStore"
import { fileIcon, formatBytes } from "@/lib/utils/format"
import Icon from "../ui/icon"
import Spinner from "../ui/spinner"
import { describeDocument } from "./document-row"

const UploadRow = ({ upload }: { upload: Upload }) => {
  const { retry, cancel, dismiss } = useUploadStore()
  const icon = fileIcon(upload.file.name)
  const busy = upload.status === 'uploading' || upload.status === 'processing'
  const failed = upload.status === 'failed'

  return (
    <div className={`flex flex-col gap-2 p-2.5 rounded-lg bg-surface-container border ${failed ? 'border-error/30' : busy ? 'border-primary/25' : 'border-transparent'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 shrink-0 rounded-lg bg-surface-container-lowest flex items-center justify-center ${failed ? 'text-error' : icon.color}`}>
            <Icon name={failed ? 'error' : icon.icon} className="text-[20px]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-label-md text-on-surface truncate" title={upload.file.name}>{upload.file.name}</span>
            <span className="text-body-sm text-outline truncate">
              {upload.status === 'queued' && `${formatBytes(upload.file.size)} • Waiting...`}
              {upload.status === 'uploading' && <span className="text-rag-syncing">Uploading {upload.progress}%</span>}
              {upload.status === 'processing' && <span className="text-rag-syncing">Reading &amp; indexing...</span>}
              {upload.status === 'done' && <span className="text-success">{upload.result ? describeDocument(upload.result) : 'Indexed'}</span>}
              {failed && <span className="text-error" title={upload.error}>{upload.error}</span>}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {busy && <Spinner className="w-4 h-4 text-rag-syncing" />}
          {upload.status === 'done' && <Icon name="check_circle" className="text-[18px] text-success" />}
          {failed && (
            <button type="button" title="Retry" aria-label={`Retry ${upload.file.name}`} onClick={() => retry(upload.id)} className="w-7 h-7 rounded-lg text-error hover:bg-error/20 flex items-center justify-center transition-colors">
              <Icon name="refresh" className="text-[16px]" />
            </button>
          )}
          {(upload.status === 'queued' || upload.status === 'uploading' || failed) && (
            <button
              type="button"
              title={failed ? 'Dismiss' : 'Cancel upload'}
              aria-label={failed ? 'Dismiss' : `Cancel ${upload.file.name}`}
              onClick={() => (failed ? dismiss(upload.id) : cancel(upload.id))}
              className="w-7 h-7 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-highest flex items-center justify-center transition-colors"
            >
              <Icon name="close" className="text-[16px]" />
            </button>
          )}
        </div>
      </div>
      {busy && (
        <div className="w-full h-1 bg-surface-container-lowest rounded-full overflow-hidden">
          {upload.status === 'uploading'
            ? <div className="h-full bg-gradient-to-r from-primary-container via-primary to-secondary rounded-full transition-all" style={{ width: `${upload.progress}%` }} />
            : <div className="h-full w-full shimmer-bar rounded-full" />}
        </div>
      )}
    </div>
  )
}

export default UploadRow
