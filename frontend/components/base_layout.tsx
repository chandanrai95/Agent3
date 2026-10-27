'use client'
import React from "react";
import Sidebar from "./shell/sidebar";
import Topbar from "./shell/topbar";
import ModalHost from "./modals/modal-host";
import { usePathname } from "next/navigation";
import { getUserAgents } from "@/lib/api/agents";
import { useAuthStore } from "@/store/useAuthStore";
import useAppStore from "@/store/useAppStore";

const BaseLayout = ({
  user,
  children
}: { user: User, children: React.ReactNode }) => {
  const pathname = usePathname();
  const { setUser, isLoggedIn } = useAuthStore();
  const { setAgents, refreshSettings } = useAppStore();

  React.useEffect(() => {
    if (!isLoggedIn) return;

    const fetchAgents = async () => {
      try {
        const _agents = await getUserAgents()
        setAgents(_agents)
      } catch (err) {
        console.error('fetchAgents', err)
        setAgents([])
      }
    }
    fetchAgents()
    refreshSettings()

    addEventListener('agents_updated', fetchAgents)

    return () => {
      removeEventListener('agents_updated', fetchAgents)
    }
  }, [isLoggedIn, setAgents, refreshSettings])

  React.useEffect(() => {
    setUser(user)
  }, [user, setUser])

  if (pathname.startsWith('/auth')) {
    return children
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar />
        {children}
      </div>
      <ModalHost />
    </div>
  )
}

export default BaseLayout;
