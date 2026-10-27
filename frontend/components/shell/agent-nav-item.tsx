'use client'
import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import useAppStore from "@/store/useAppStore"
import { deleteAgent } from "@/lib/api/agents"
import { errorMessage } from "@/lib/api/errors"
import { getModel } from "@/lib/utils/model"
import { initials } from "@/lib/utils/format"
import Icon from "../ui/icon"
import Spinner from "../ui/spinner"
import ThreadList from "./thread-list"

type Props = {
  agent: Agent
  active: boolean
  tileColor: string
}

const AgentNavItem = ({ agent, active, tileColor }: Props) => {
  const router = useRouter()
  const { openModal, setSidebarOpen } = useAppStore()
  const [expanded, setExpanded] = React.useState(active)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const model = getModel(agent.model)

  // the open agent always shows its conversations
  React.useEffect(() => {
    if (active) setExpanded(true)
  }, [active])

  React.useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setConfirmDelete(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const onDelete = async () => {
    if (!confirmDelete) return setConfirmDelete(true)
    try {
      setDeleting(true)
      await deleteAgent(agent._id)
      toast(`${agent.name} was deleted`, { type: 'success' })
      setMenuOpen(false)
      dispatchEvent(new Event('agents_updated'))
      if (active) router.replace('/')
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className={`group relative flex items-center rounded-lg transition-colors ${active ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
        {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary" />}
        <button
          type="button"
          aria-label={expanded ? `Hide ${agent.name} conversations` : `Show ${agent.name} conversations`}
          aria-expanded={expanded}
          onClick={() => setExpanded((e) => !e)}
          className="pl-2 py-2 text-outline hover:text-on-surface flex"
        >
          <Icon name="chevron_right" className={`text-[16px] transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
        <Link
          href={`/agent/${agent._id}`}
          onClick={() => setSidebarOpen(false)}
          aria-current={active ? 'page' : undefined}
          className="flex-1 min-w-0 flex items-center gap-2 pl-1 pr-1 py-2"
        >
          <div className={`w-7 h-7 shrink-0 rounded-lg bg-surface-container-highest flex items-center justify-center text-label-md font-bold ${tileColor}`}>
            {initials(agent.name).slice(0, 1)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-label-md">{agent.name}</span>
            <span className={`text-label-sm ${active ? model.color : 'text-outline'}`}>{agent.model}</span>
          </div>
        </Link>

        <div ref={menuRef} className="relative pr-1.5">
          <button
            type="button"
            aria-label={`${agent.name} options`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className={`w-7 h-7 rounded-md flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-highest transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
          >
            <Icon name="more_horiz" className="text-[18px]" />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 top-full mt-1 z-50 w-44 p-1 rounded-xl bg-surface-container-low border border-surface-container-highest shadow-xl flex flex-col">
              <button
                type="button"
                role="menuitem"
                onClick={() => { setMenuOpen(false); setSidebarOpen(false); openModal({ type: 'edit-agent', agent }) }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-label-md text-on-surface hover:bg-surface-container-high text-left"
              >
                <Icon name="edit" className="text-[16px] text-outline" />
                Edit agent
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={onDelete}
                disabled={deleting}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-label-md text-left transition-colors ${confirmDelete ? 'bg-error-container text-white' : 'text-error hover:bg-surface-container-high'}`}
              >
                {deleting ? <Spinner className="w-4 h-4" /> : <Icon name="delete" className="text-[16px]" />}
                {confirmDelete ? 'Click to confirm' : 'Delete agent'}
              </button>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <React.Suspense fallback={null}>
          <ThreadList agentId={agent._id} isActiveAgent={active} />
        </React.Suspense>
      )}
    </div>
  )
}

export default AgentNavItem
