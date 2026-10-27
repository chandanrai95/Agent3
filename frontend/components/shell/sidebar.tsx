'use client'
import React from "react"
import Link from "next/link"
import AgentNavItem from "./agent-nav-item"
import { useParams, useRouter } from "next/navigation"
import { toast } from "react-toastify"
import useAppStore from "@/store/useAppStore"
import { useAuthStore } from "@/store/useAuthStore"
import { initials } from "@/lib/utils/format"
import Icon from "../ui/icon"
import Logo from "../ui/logo"
import Spinner from "../ui/spinner"

const TILE_COLORS = ['text-primary', 'text-secondary', 'text-tertiary', 'text-rag-indexed', 'text-success']

const Sidebar = () => {
  const { agents, agentsLoaded, openModal, sidebarOpen, setSidebarOpen } = useAppStore()
  const { user, logout } = useAuthStore()
  const { id } = useParams<{ id?: string }>()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = React.useState(false)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openModal({ type: 'add-agent' })
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openModal])

  const onLogout = async () => {
    try {
      setLoggingOut(true)
      await logout()
      router.replace('/auth/login')
    } catch (err) {
      console.error('onLogout', err)
      toast('Could not log out.', { type: 'error' })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] shrink-0 h-screen bg-surface-container-low flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.25)] transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col min-h-0">
          <div className="p-4">
            <Link href="/" onClick={() => setSidebarOpen(false)}><Logo badge="Beta" /></Link>
          </div>
          <div className="px-4 pb-3">
            <button
              type="button"
              onClick={() => { setSidebarOpen(false); openModal({ type: 'add-agent' }) }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-primary-container text-on-primary text-label-md font-medium shadow-sm transition-colors hover:bg-primary"
            >
              <span className="flex items-center gap-1"><Icon name="add" className="text-[18px]" />New Agent</span>
              <kbd className="px-1 py-0.5 rounded bg-surface-container-lowest text-primary font-mono text-code">⌘K</kbd>
            </button>
          </div>
          <div className="px-4 pt-3 pb-1">
            <span className="text-label-sm uppercase tracking-wider text-outline">Your agents</span>
          </div>

          <nav className="flex flex-col px-2 gap-1 overflow-y-auto pb-2 min-h-0">
            {!agentsLoaded && (
              <div className="flex justify-center py-6 text-outline"><Spinner /></div>
            )}
            {agentsLoaded && agents.length === 0 && (
              <div className="mx-1 my-1 p-3 rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-lowest/50 flex flex-col items-center text-center gap-1">
                <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-outline mb-1">
                  <Icon name="smart_toy" className="text-[20px]" />
                </div>
                <span className="text-label-md text-on-surface font-medium">No agents created yet</span>
                <span className="text-label-sm text-outline">Created agents will appear here</span>
              </div>
            )}
            {agents.map((agent, i) => (
              <AgentNavItem key={agent._id} agent={agent} active={agent._id === id} tileColor={TILE_COLORS[i % TILE_COLORS.length]} />
            ))}
          </nav>
        </div>

        <div className="p-3 bg-surface-container-lowest m-2 rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-primary-container to-tertiary-container flex items-center justify-center text-label-md font-semibold text-surface-dark">
              {initials(user?.name)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-label-md text-on-surface truncate">{user?.name}</span>
              <span className="text-label-sm text-outline truncate">{user?.email}</span>
            </div>
          </div>
          <button
            type="button"
            title="Log out"
            aria-label="Log out"
            onClick={onLogout}
            disabled={loggingOut}
            className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors"
          >
            {loggingOut ? <Spinner /> : <Icon name="logout" className="text-[18px]" />}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
