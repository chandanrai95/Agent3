import React from "react"

const Layout = ({ children }: { children: React.ReactNode}) => {
  return (
    <div 
      className="flex flex-1 overflow-y-auto flex-col"
    >
      {children}
    </div>
  )
}

export default Layout