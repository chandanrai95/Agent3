'use client'
import Link from "next/link"
import Icon from "../ui/icon"
import ModelSelect from "../ui/model-select"
import ScopeSelect from "./scope-select"

type Props = {
  agent: Agent
  documents: Source[]
  scope: string
  onScopeChange: (value: string) => void
  onModelChange: (model: string) => void
  savingModel: boolean
  onEditRole: () => void
  onNewChat: () => void
  canStartNewChat: boolean
  drawerOpen: boolean
  onToggleDrawer: () => void
}

const AgentBar = ({
  agent, documents, scope, onScopeChange, onModelChange, savingModel,
  onEditRole, onNewChat, canStartNewChat, drawerOpen, onToggleDrawer,
}: Props) => (
  <section className="sticky top-0 z-30 w-full bg-surface-container-low/95 backdrop-blur-md px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 shadow-sm">
      <div className="flex items-center gap-2.5 min-w-0 flex-1 md:flex-none">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
          <Icon name="smart_toy" filled className="text-[20px]" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-headline-sm font-medium text-on-surface truncate">{agent.name}</h1>
            <span className="hidden 2xl:flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-container-high text-label-sm text-on-surface-variant">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Online
            </span>
          </div>
          <div className="group relative flex items-center gap-1">
            <button type="button" onClick={onEditRole} className="text-label-sm text-outline hover:text-on-surface truncate max-w-[160px] sm:max-w-[200px] 2xl:max-w-[320px] text-left transition-colors">
              Role: {agent.role}
            </button>
            <Icon name="edit" className="text-[13px] text-outline" />
            <div className="absolute left-0 top-full mt-1 hidden group-hover:flex flex-col w-80 p-4 rounded-xl bg-surface-container-highest text-on-surface shadow-xl z-50">
              <span className="text-label-sm text-primary uppercase tracking-wider mb-1">System prompt</span>
              <p className="text-body-sm text-on-surface-variant leading-relaxed line-clamp-[10]">{agent.role}</p>
              <span className="mt-2 pt-2 border-t border-surface-bright text-label-sm text-outline">Click to edit • strict grounding always on</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block h-6 w-px bg-surface-container-highest" />

      <div className="order-last md:order-none w-full md:w-auto flex items-center gap-2 flex-wrap">
        <ModelSelect variant="pill" value={agent.model} onChange={onModelChange} loading={savingModel} />
        <ScopeSelect value={scope} onChange={onScopeChange} documents={documents} />
      </div>

    <div className="flex items-center gap-1.5 ml-auto">
      <Link href={`/agent/${agent._id}/integrations`} title="Use this agent on other platforms" className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface text-label-md transition-colors shadow-sm">
        <Icon name="api" className="text-[18px]" />
        <span className="hidden sm:inline">Integrate</span>
      </Link>
      {/* <button type="button" title="New chat" aria-label="New chat" onClick={onNewChat} disabled={!canStartNewChat} className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors shadow-sm flex disabled:opacity-40">
        <Icon name="add_comment" className="text-[18px]" />
      </button> */}
      <button type="button" title={drawerOpen ? 'Hide knowledge sources' : 'Show knowledge sources'} aria-label="Toggle knowledge sources panel" onClick={onToggleDrawer} className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-lg shadow-sm text-label-md transition-colors ${drawerOpen ? 'bg-primary-container/20 text-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'}`}>
        <Icon name="menu_book" className="text-[18px]" />
        <span className="hidden sm:inline">Sources</span>
        <span className="px-1.5 rounded-full bg-surface-container-highest text-label-sm text-on-surface-variant">{documents.length}</span>
      </button>
    </div>
  </section>
)

export default AgentBar
