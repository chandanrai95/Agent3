import { create } from "zustand";
import { uploadDocument } from "@/lib/api/documents";
import { errorMessage } from "@/lib/api/errors";
import useAppStore from "./useAppStore";

export type Upload = {
  id: string
  agentId: string
  file: File
  status: 'queued' | 'uploading' | 'processing' | 'done' | 'failed'
  progress: number
  error?: string
  result?: Source
}

interface UploadStore {
  uploads: Upload[]
  enqueue: (agentId: string, files: File[]) => void
  retry: (id: string) => void
  cancel: (id: string) => void
  dismiss: (id: string) => void
}

// finished uploads stay visible briefly, then the document list takes over
const DONE_VISIBLE_MS = 4000

const controllers: Record<string, AbortController> = {}
let running = false

export const useUploadStore = create<UploadStore>((set, get) => {
  const patch = (id: string, change: Partial<Upload>) =>
    set((s) => ({ uploads: s.uploads.map((u) => (u.id === id ? { ...u, ...change } : u)) }))

  // one upload at a time across agents: indexing is CPU and API heavy on the backend
  const processQueue = async () => {
    if (running) return
    running = true
    try {
      let next: Upload | undefined
      while ((next = get().uploads.find((u) => u.status === 'queued'))) {
        const upload = next
        const controller = new AbortController()
        controllers[upload.id] = controller
        patch(upload.id, { status: 'uploading', progress: 0 })
        try {
          const result = await uploadDocument({
            agentId: upload.agentId,
            file: upload.file,
            signal: controller.signal,
            onProgress: (progress) => patch(upload.id, progress >= 100 ? { progress, status: 'processing' } : { progress }),
          })
          patch(upload.id, { status: 'done', result })
          useAppStore.getState().refreshDocuments(upload.agentId)
          useAppStore.getState().refreshSettings()
          setTimeout(() => get().dismiss(upload.id), DONE_VISIBLE_MS)
        } catch (err) {
          if (controller.signal.aborted) get().dismiss(upload.id)
          else patch(upload.id, { status: 'failed', error: errorMessage(err, 'Upload failed') })
        } finally {
          delete controllers[upload.id]
        }
      }
    } finally {
      running = false
    }
  }

  return {
    uploads: [],
    enqueue: (agentId, files) => {
      set((s) => ({
        uploads: [
          ...s.uploads,
          ...files.map((file) => ({
            id: `${agentId}-${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
            agentId,
            file,
            status: 'queued' as const,
            progress: 0,
          })),
        ],
      }))
      processQueue()
    },
    retry: (id) => {
      patch(id, { status: 'queued', error: undefined, progress: 0 })
      processQueue()
    },
    cancel: (id) => {
      if (controllers[id]) controllers[id].abort()
      else get().dismiss(id)
    },
    dismiss: (id) => set((s) => ({ uploads: s.uploads.filter((u) => u.id !== id) })),
  }
})

export default useUploadStore
