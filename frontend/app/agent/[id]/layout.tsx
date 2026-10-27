import React from "react"

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {children}
    </div>
  )
}

export default Layout
