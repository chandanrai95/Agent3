'use client'
import React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "react-toastify"
import useAppStore from "@/store/useAppStore"
import { deleteThread, renameThread } from "@/lib/api/threads"
import { errorMessage } from "@/lib/api/errors"
import { timeAgo } from "@/lib/utils/format"
import Icon from "../ui/icon"
import Spinner from "../ui/spinner"

const EMPTY: Thread[] = []

const ThreadRow = ({ agentId, thread, active }: { agentId: string, thread: Thread, active: boolean }) => {
  const router = useRouter()
  const { refreshThreads, setSidebarOpen } = useAppStore()
  const [editing, setEditing] = React.useState(false)
  const [title, setTitle] = React.useState(thread.title || '')
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  const saveTitle = async () => {
    setEditing(false)
    const next = title.trim()
    if (!next || next === thread.title) return setTitle(thread.title || '')
    try {
      await renameThread(agentId, thread._id, next)
      refreshThreads(agentId)
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
      setTitle(thread.title || '')
    }
  }

  const remove = async () => {
    if (!confirmDelete) return setConfirmDelete(true)
    try {
      setBusy(true)
      await deleteThread(agentId, thread._id)
      await refreshThreads(agentId)
      if (active) router.replace(`/agent/${agentId}`)
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
    } finally {
      setBusy(false)
      setConfirmDelete(false)
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={title}
        maxLength={255}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') saveTitle()
          if (e.key === 'Escape') { setTitle(thread.title || ''); setEditing(false) }
        }}
        className="w-full px-2 py-1.5 rounded-md bg-surface-container-highest text-label-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
      />
    )
  }

  return (
    <div
      className={`group relative flex items-center rounded-md transition-colors ${active ? 'bg-surface-container-highest text-on-surface' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
      onMouseLeave={() => setConfirmDelete(false)}
    >
      <Link
        href={`/agent/${agentId}?thread=${thread._id}`}
        onClick={() => setSidebarOpen(false)}
        aria-current={active ? 'page' : undefined}
        className="flex-1 min-w-0 flex items-center gap-2 pl-2 pr-1 py-1.5"
      >
        <span className="truncate text-label-md">{thread.title || 'Untitled chat'}</span>
        <span className="ml-auto shrink-0 text-label-sm text-outline group-hover:hidden">{timeAgo(thread.updated_at)}</span>
      </Link>
      <div className={`items-center pr-1 shrink-0 ${confirmDelete || busy ? 'flex' : 'hidden group-hover:flex group-focus-within:flex'}`}>
        {!confirmDelete && (
          <button type="button" title="Rename" aria-label={`Rename ${thread.title}`} onClick={() => setEditing(true)} className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface">
            <Icon name="edit" className="text-[14px]" />
          </button>
        )}
        <button
          type="button"
          title={confirmDelete ? 'Click again to delete' : 'Delete chat'}
          aria-label={`Delete ${thread.title}`}
          onClick={remove}
          className={`h-6 rounded flex items-center justify-center gap-1 transition-colors ${confirmDelete ? 'px-1.5 bg-error-container text-white text-label-sm' : 'w-6 text-outline hover:text-error'}`}
        >
          {busy ? <Spinner className="w-3 h-3" /> : <Icon name="delete" className="text-[14px]" />}
          {confirmDelete && !busy && 'Delete?'}
        </button>
      </div>
    </div>
  )
}

const ThreadList = ({ agentId, isActiveAgent }: { agentId: string, isActiveAgent: boolean }) => {
  const searchParams = useSearchParams()
  const activeThread = isActiveAgent ? searchParams.get('thread') : null
  const { threads: allThreads, threadsLoading, refreshThreads, setSidebarOpen } = useAppStore()
  const threads = allThreads[agentId] || EMPTY

  React.useEffect(() => {
    if (!allThreads[agentId]) refreshThreads(agentId)
  }, [agentId, allThreads, refreshThreads])

  return (
    <div className="ml-[22px] pl-2 border-l border-surface-container-highest flex flex-col gap-0.5 py-1">
      <Link
        href={`/agent/${agentId}`}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-label-md transition-colors ${isActiveAgent && !activeThread ? 'bg-surface-container-highest text-primary' : 'text-primary/80 hover:text-primary hover:bg-surface-container'}`}
      >
        <Icon name="add" className="text-[16px]" />
        New chat
      </Link>
      {threadsLoading[agentId] && threads.length === 0 && <div className="px-2 py-1.5 text-outline"><Spinner className="w-3 h-3" /></div>}
      {threads.map((thread) => (
        <ThreadRow key={thread._id} agentId={agentId} thread={thread} active={thread._id === activeThread} />
      ))}
      {!threadsLoading[agentId] && threads.length === 0 && (
        <span className="px-2 py-1 text-label-sm text-outline">No conversations yet</span>
      )}
    </div>
  )
}

export default ThreadList
