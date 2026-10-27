import BrandPanel from "@/components/auth/brand-panel"

const AuthLayout = ({
  children
}: { children: React.ReactNode }) => {
  return (
    <main className="w-full min-h-screen flex flex-col lg:flex-row">
      <BrandPanel />
      <div className="flex-1 bg-surface flex items-center justify-center p-6 sm:p-10 lg:p-16 lg:min-h-screen">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </main>
  )
}

export default AuthLayout
