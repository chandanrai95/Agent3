import React from "react"

const AgentLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-1 min-h-0 flex-col max-w-full">
      {children}
    </div>
  )
}

export default AgentLayout
