'use client'
import React from "react";
import Sidebar from "./sidebar";
import Header from "./agent-header";
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
  const { agents, setAgents } = useAppStore();

  const fetchAgents = async () => {
    try {
      const _agents = await getUserAgents()
      setAgents(_agents)
    } catch (err) {
      console.error('fetchAgents', err)
    }
  }

  React.useEffect(() => {
    if (!isLoggedIn) return;
    fetchAgents()

    addEventListener('agents_updated',fetchAgents)

    return () => {
      removeEventListener('agents_updated',fetchAgents)
    }
  }, [isLoggedIn])

  React.useEffect(() => {
    setUser(user)
  },[user])

  if (pathname.startsWith('/auth')) {
    return children
  }


  return (
    <div className="flex flex-1 h-screen">
      <Sidebar />
      <div
        className="flex flex-1 flex-col"
      >
        {/* <Header /> */}
        {children}
      </div>

    </div>
  )
}

export default BaseLayout;