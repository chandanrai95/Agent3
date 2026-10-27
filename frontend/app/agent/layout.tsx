import Header from "@/components/agent-header"
import React from "react"

const AgentLayout = ({ children }: { children: React.ReactNode}) => {
  return (
    <div 
      className="flex flex-1 overflow-y-auto flex-col max-w-full"
    >
      {children}
    </div>
  )
}

export default AgentLayout