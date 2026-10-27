import Icon from "./icon"

const Logo = ({ badge }: { badge?: string }) => (
  <div className="flex items-center gap-2.5">
    <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary-container to-inverse-primary flex items-center justify-center shadow-md shadow-primary-container/30">
      <Icon name="smart_toy" filled className="text-[20px] text-white" />
      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-surface-dark">
        <span className="h-1.5 w-1.5 rounded-full bg-rag-indexed" />
      </span>
    </div>
    <span className="text-headline-sm font-semibold tracking-tight text-on-surface whitespace-nowrap">Agent Builder</span>
    {badge && (
      <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-label-sm">{badge}</span>
    )}
  </div>
)

export default Logo
