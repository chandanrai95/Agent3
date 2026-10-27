import BrandPanel from "@/components/auth/brand-panel"
import Logo from "@/components/ui/logo"

const AuthLayout = ({
  children
}: { children: React.ReactNode }) => {
  return (
    <main className="w-full min-h-screen flex flex-col lg:flex-row">
      <BrandPanel />
      <div className="flex-1 bg-surface flex items-center justify-center p-6 sm:p-10 lg:p-16 min-h-screen">
        <div className="relative w-full max-w-md">
          <div className="absolute -top-24 -left-16 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl pointer-events-none lg:hidden" />
          <div className="relative mb-10 lg:hidden"><Logo /></div>
          {children}
        </div>
      </div>
    </main>
  )
}

export default AuthLayout
