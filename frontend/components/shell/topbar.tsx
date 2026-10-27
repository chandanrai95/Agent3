'use client'
import useAppStore from "@/store/useAppStore"
import Icon from "../ui/icon"
import Logo from "../ui/logo"

// only shown below lg, where the sidebar is off-canvas
const Topbar = () => {
  const { setSidebarOpen } = useAppStore()
  return (
    <header className="lg:hidden sticky top-0 z-30 h-14 shrink-0 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.2)] flex items-center gap-3 px-4">
      <button type="button" aria-label="Open sidebar" className="text-outline hover:text-on-surface flex" onClick={() => setSidebarOpen(true)}>
        <Icon name="menu" />
      </button>
      <Logo />
    </header>
  )
}

export default Topbar
