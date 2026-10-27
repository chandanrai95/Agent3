'use client'
import Image from "next/image";
import Link from "next/link";
import useAppStore from "@/store/useAppStore";
import { getModel } from "@/lib/utils/model";
import { ROLE_TEMPLATES } from "@/components/modals/role-templates";
import Icon from "@/components/ui/icon";
import Spinner from "@/components/ui/spinner";
import type { IconName } from "@/components/ui/icon-names";

const STEPS = ['Pick a model', 'Give it a role', 'Upload documents', 'Start chatting']

const STARTERS: (typeof ROLE_TEMPLATES[number] & { name: string, model: string, category: string, tags: [IconName, string][] })[] = [
  { ...ROLE_TEMPLATES[1], name: 'Legal Contract Reviewer', model: 'gpt-4.1', category: 'Legal', tags: [['description', 'PDF & DOCX'], ['format_quote', 'Clause citations']] },
  { ...ROLE_TEMPLATES[0], name: 'HR Policy Assistant', model: 'gpt-4.1-mini', category: 'People ops', tags: [['badge', 'Policies'], ['help', 'Employee FAQs']] },
  { ...ROLE_TEMPLATES[2], name: 'Customer Support Bot', model: 'gpt-4o-mini', category: 'Support', tags: [['menu_book', 'Product docs'], ['image', 'Screenshots']] },
]

export default function Home() {
  const { agents, agentsLoaded, openModal } = useAppStore()
  const hasAgents = agents.length > 0

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-10 flex flex-col items-center">
        <div className="relative flex flex-col items-center text-center max-w-2xl">
          <div className="absolute -top-12 w-64 h-64 bg-primary-container/20 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute -top-6 -left-12 w-48 h-48 bg-secondary/15 rounded-full blur-2xl pointer-events-none -z-10" />
          <Image src="/agent-illustration.svg" alt="" width={288} height={216} priority className="w-60 sm:w-72 h-auto mb-4 drop-shadow-xl" />

          <h1 className="text-[30px] leading-[38px] sm:text-display font-semibold tracking-tight text-on-surface mb-2">
            {hasAgents ? 'Pick an agent or create a new one' : 'Create your first agent'}
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-xl mb-6">
            Pick a model, give it a role, upload documents, and start chatting.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-8 p-2 rounded-xl bg-surface-container-low/70 border border-border-dark">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && <Icon name="chevron_right" className="text-outline text-[16px]" />}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-mono text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-label-sm text-on-surface">{step}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => openModal({ type: 'add-agent' })}
            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-container text-on-primary text-label-md font-medium transition-all hover:bg-primary shadow-lg shadow-primary-container/25"
          >
            <Icon name="add" className="text-[20px] group-hover:rotate-90 transition-transform duration-300" />
            New Agent
            <kbd className="px-1 py-0.5 rounded bg-surface-container-lowest text-primary font-mono text-[11px] ml-1">⌘K</kbd>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-outline text-label-sm">
            <span className="flex items-center gap-1.5"><Icon name="format_quote" className="text-[16px] text-rag-indexed" />Cited, grounded answers</span>
            <span className="flex items-center gap-1.5"><Icon name="table_chart" className="text-[16px] text-success" />Tables, images &amp; scans</span>
            <span className="flex items-center gap-1.5"><Icon name="api" className="text-[16px] text-secondary" />Public API per agent</span>
          </div>
        </div>

        {!agentsLoaded && <div className="mt-10 text-outline"><Spinner /></div>}

        {hasAgents && (
          <section className="w-full mt-12 flex flex-col">
            <h2 className="text-headline-sm text-on-surface tracking-tight mb-4">Your agents</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => {
                const model = getModel(agent.model)
                return (
                  <Link key={agent._id} href={`/agent/${agent._id}`} className="group flex flex-col gap-2 p-5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                        <Icon name="smart_toy" className="text-[22px]" />
                      </div>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-highest">
                        <span className={`w-1.5 h-1.5 rounded-full ${model.dot}`} />
                        <span className={`font-mono text-code ${model.color}`}>{agent.model}</span>
                      </span>
                    </div>
                    <h3 className="text-headline-sm text-on-surface group-hover:text-primary transition-colors truncate">{agent.name}</h3>
                    <p className="text-body-sm text-on-surface-variant line-clamp-2">{agent.role}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <section className="w-full mt-12 flex flex-col">
          <div className="mb-4">
            <h2 className="text-headline-sm text-on-surface tracking-tight">Starter agents</h2>
            <p className="text-body-sm text-on-surface-variant">Start from a ready-made role and adjust it to your documents.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {STARTERS.map((starter) => {
              const model = getModel(starter.model)
              return (
                <div key={starter.name} className="group flex flex-col justify-between p-5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors shadow-md">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center ${starter.color} group-hover:scale-105 transition-transform`}>
                        <Icon name={starter.icon} className="text-[24px]" />
                      </div>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-highest">
                        <span className={`w-1.5 h-1.5 rounded-full ${model.dot}`} />
                        <span className={`font-mono text-code ${model.color}`}>{starter.model}</span>
                      </span>
                    </div>
                    <span className="text-label-sm uppercase text-outline tracking-wider mb-1">{starter.category}</span>
                    <h3 className="text-headline-sm text-on-surface mb-1">{starter.name}</h3>
                    <p className="text-body-sm text-on-surface-variant mb-4 line-clamp-3">{starter.role}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {starter.tags.map(([icon, label]) => (
                        <span key={label} className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono text-[11px] flex items-center gap-1">
                          <Icon name={icon} className="text-[12px] text-rag-indexed" />{label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal({ type: 'add-agent', template: { name: starter.name, model: starter.model, role: starter.role } })}
                    className="self-end flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-primary-container text-on-surface hover:text-on-primary text-label-md transition-colors shadow-sm"
                  >
                    <Icon name="add" className="text-[16px]" />Use template
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
