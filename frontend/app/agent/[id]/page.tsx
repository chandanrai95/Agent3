'use client'

import React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "react-toastify"
import { getAgentById, updateAgentModel } from "@/lib/api/agents"
import { createThread, getLatestThread, getThreadMessages, streamThreadMessage } from "@/lib/api/threads"
import { errorMessage } from "@/lib/api/errors"
import { dayLabel } from "@/lib/utils/format"
import useAppStore from "@/store/useAppStore"
import { useAuthStore } from "@/store/useAuthStore"
import AgentBar from "@/components/chat/agent-bar"
import Composer from "@/components/chat/composer"
import SourcesDrawer from "@/components/chat/sources-drawer"
import { AssistantMessage, UserMessage } from "@/components/chat/messages"
import Icon from "@/components/ui/icon"
import Spinner from "@/components/ui/spinner"
import { btnPrimary } from "@/components/ui/styles"

const EMPTY_DOCS: Source[] = []

const AgentPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore()
  const { openModal, documents: allDocuments, documentsLoading, refreshDocuments } = useAppStore()
  const documents = allDocuments[id] || EMPTY_DOCS

  const [agent, setAgent] = React.useState<Agent | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [thread, setThread] = React.useState<Thread | null>(null)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [historyLoading, setHistoryLoading] = React.useState(true)
  const [streaming, setStreaming] = React.useState(false)
  const [scope, setScope] = React.useState('')
  const [savingModel, setSavingModel] = React.useState(false)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  const abortRef = React.useRef<AbortController | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // open the drawer by default on wide screens
  React.useEffect(() => {
    setDrawerOpen(window.matchMedia('(min-width: 1280px)').matches)
  }, [])

  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      setAgent(null)
      setLoadError(null)
      setMessages([])
      setThread(null)
      setScope('')
      setHistoryLoading(true)
      try {
        const _agent = await getAgentById(id)
        if (cancelled) return
        setAgent(_agent)
        refreshDocuments(id)
        const latest = await getLatestThread(id)
        if (cancelled) return
        setThread(latest)
        setMessages(latest ? await getThreadMessages(id, latest._id) : [])
      } catch (err) {
        console.error('load agent', err)
        if (!cancelled) setLoadError(errorMessage(err, 'Could not load this agent.'))
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
      abortRef.current?.abort()
    }
  }, [id, refreshDocuments])

  React.useEffect(() => {
    const onAgentUpdated = async () => setAgent(await getAgentById(id))
    addEventListener('agent_updated', onAgentUpdated)
    return () => removeEventListener('agent_updated', onAgentUpdated)
  }, [id])

  // keep the newest message in view
  React.useEffect(() => {
    const el = scrollRef.current
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 240) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  const updateLast = (change: (m: ChatMessage) => Partial<ChatMessage>) =>
    setMessages((list) => list.map((m, i) => (i === list.length - 1 ? { ...m, ...change(m) } : m)))

  const send = async (text: string) => {
    if (!agent || streaming) return
    const now = new Date().toISOString()
    setMessages((list) => [
      ...list,
      { _id: `user-${now}`, role: 'user', content: text, sources: [], created_at: now },
      { _id: `assistant-${now}`, role: 'assistant', content: '', sources: [], created_at: now, streaming: true },
    ])
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }))

    const controller = new AbortController()
    abortRef.current = controller
    setStreaming(true)
    try {
      let threadId = thread?._id
      if (!threadId) {
        const created = await createThread(id, text.slice(0, 80))
        setThread(created)
        threadId = created._id
      }
      await streamThreadMessage({
        agentId: id,
        threadId,
        message: text,
        sourceIds: scope ? [scope] : undefined,
        signal: controller.signal,
        onEvent: (event) => {
          if (event.type === 'token') updateLast((m) => ({ content: m.content + event.content }))
          else if (event.type === 'sources') updateLast(() => ({ sources: event.sources }))
          else if (event.type === 'done') updateLast(() => ({ _id: event.message_id, content: event.answer, sources: event.sources, created_at: event.created_at, streaming: false }))
          else if (event.type === 'error') updateLast(() => ({ error: event.detail, streaming: false }))
        },
      })
    } catch (err) {
      if (controller.signal.aborted) {
        updateLast((m) => ({ streaming: false, error: m.content ? undefined : 'Stopped before an answer was written.' }))
      } else {
        console.error('send', err)
        updateLast(() => ({ streaming: false, error: errorMessage(err, 'The agent could not answer. Please try again.') }))
      }
    } finally {
      updateLast(() => ({ streaming: false }))
      setStreaming(false)
      abortRef.current = null
    }
  }

  const onModelChange = async (model: string) => {
    if (!agent) return
    try {
      setSavingModel(true)
      const updated = await updateAgentModel({ id, model })
      setAgent(updated)
      dispatchEvent(new Event('agents_updated'))
      toast(`Model switched to ${model}`, { type: 'success', autoClose: 2000 })
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
    } finally {
      setSavingModel(false)
    }
  }

  const onNewChat = () => {
    abortRef.current?.abort()
    setThread(null)
    setMessages([])
  }

  const openUpload = (files?: File[]) => openModal({ type: 'documents', agentId: id, files })

  if (loadError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <Icon name="error" className="text-[40px] text-error" />
        <p className="text-headline-sm text-on-surface">{loadError}</p>
        <Link href="/" className={btnPrimary}>Back to agents</Link>
      </div>
    )
  }

  if (!agent) {
    return <div className="flex flex-1 items-center justify-center text-outline"><Spinner className="w-6 h-6" /></div>
  }

  const scopeDoc = documents.find((d) => d._id === scope)

  return (
    <div className="flex flex-1 min-h-0">
      <div className="relative flex flex-1 flex-col min-w-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 left-10 w-80 h-80 bg-rag-indexed/5 rounded-full blur-3xl pointer-events-none" />

        <AgentBar
          agent={agent}
          documents={documents}
          scope={scope}
          onScopeChange={setScope}
          onModelChange={onModelChange}
          savingModel={savingModel}
          onEditRole={() => openModal({ type: 'edit-role', agent })}
          onUpload={() => openUpload()}
          onNewChat={onNewChat}
          canStartNewChat={messages.length > 0}
          drawerOpen={drawerOpen}
          onToggleDrawer={() => setDrawerOpen((o) => !o)}
        />

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-8">
            {historyLoading && <div className="flex justify-center py-10 text-outline"><Spinner className="w-5 h-5" /></div>}

            {!historyLoading && messages.length === 0 && (
              <div className="flex flex-col items-center text-center gap-3 py-16">
                <div className="w-14 h-14 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center shadow-[0_0_24px_rgba(128,131,255,0.3)]">
                  <Icon name="forum" className="text-[30px]" />
                </div>
                <h2 className="text-headline-md font-semibold text-on-surface">Ask {agent.name} anything</h2>
                {documents.length > 0 ? (
                  <p className="text-body-md text-on-surface-variant max-w-md">
                    Answers come only from your {documents.length} indexed document{documents.length > 1 ? 's' : ''}, with citations you can check.
                  </p>
                ) : (
                  <>
                    <p className="text-body-md text-on-surface-variant max-w-md">This agent has no documents yet, so it can&apos;t answer questions. Upload some to get started.</p>
                    <button type="button" className={btnPrimary} onClick={() => openUpload()}>
                      <Icon name="upload_file" className="text-[18px]" />Upload documents
                    </button>
                  </>
                )}
              </div>
            )}

            {messages.map((message, i) => {
              const showDay = i === 0 || dayLabel(messages[i - 1].created_at) !== dayLabel(message.created_at)
              return (
                <React.Fragment key={message._id}>
                  {showDay && (
                    <div className="flex items-center justify-center">
                      <span className="px-3 py-0.5 rounded-full bg-surface-container text-outline text-label-sm uppercase tracking-wider shadow-sm">
                        {dayLabel(message.created_at)}
                      </span>
                    </div>
                  )}
                  {message.role === 'user'
                    ? <UserMessage message={message} userName={user?.name} />
                    : <AssistantMessage message={message} agent={agent} />}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        <Composer
          agentName={agent.name}
          streaming={streaming}
          documentsCount={documents.length}
          scopeLabel={scopeDoc ? scopeDoc.source_name : `All sources (${documents.length} document${documents.length === 1 ? '' : 's'})`}
          onSend={send}
          onStop={() => abortRef.current?.abort()}
          onAttach={() => openUpload()}
          onShowSources={() => setDrawerOpen(true)}
        />
      </div>

      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/40 xl:hidden" onClick={() => setDrawerOpen(false)} />
          <SourcesDrawer
            agentId={id}
            documents={documents}
            loading={!!documentsLoading[id]}
            onClose={() => setDrawerOpen(false)}
            onAdd={openUpload}
            onDeleted={(sourceId) => {
              refreshDocuments(id)
              if (scope === sourceId) setScope('')
            }}
          />
        </>
      )}
    </div>
  )
}

export default AgentPage
