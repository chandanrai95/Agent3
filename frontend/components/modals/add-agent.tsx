'use client'
import React from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import useAppStore, { AgentTemplate } from "@/store/useAppStore"
import { addAgent } from "@/lib/api/agents"
import { errorMessage } from "@/lib/api/errors"
import Modal from "../ui/modal"
import Icon from "../ui/icon"
import Spinner from "../ui/spinner"
import ModelSelect from "../ui/model-select"
import { btnPrimary, btnSecondary, inputBase } from "../ui/styles"
import { ROLE_TEMPLATES } from "./role-templates"

const NAME_MIN = 6
const NAME_MAX = 60
const ROLE_MAX = 4000

const AddAgentModal = ({ template }: { template?: AgentTemplate }) => {
  const router = useRouter()
  const { closeModal } = useAppStore()
  const [name, setName] = React.useState(template?.name || '')
  const [model, setModel] = React.useState(template?.model || 'gpt-4.1-mini')
  const [role, setRole] = React.useState(template?.role || '')
  const [submitted, setSubmitted] = React.useState(false)
  const [isAdding, setIsAdding] = React.useState(false)

  const nameValid = name.trim().length >= NAME_MIN
  const roleValid = role.trim().length > 0

  const onCreate = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setSubmitted(true)
    if (!nameValid || !roleValid) return
    try {
      setIsAdding(true)
      const agent = await addAgent({ name: name.trim(), model, role: role.trim() })
      dispatchEvent(new Event('agents_updated'))
      toast(`${agent.name} is ready. Upload documents to give it knowledge.`, { type: 'success' })
      closeModal()
      router.push(`/agent/${agent._id}`)
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Modal
      eyebrow="New agent"
      title="Create New AI Agent"
      subtitle="Give it a name, pick a model and describe its role. You can upload documents next."
      onClose={closeModal}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={closeModal}>Cancel</button>
          <button type="submit" form="add-agent-form" className={btnPrimary} disabled={isAdding}>
            {isAdding ? <Spinner /> : <Icon name="add" className="text-[18px]" />}
            {isAdding ? 'Creating agent...' : 'Create agent'}
          </button>
        </>
      }
    >
      <form id="add-agent-form" className="flex flex-col gap-5" onSubmit={onCreate} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="agent-name" className="text-label-md text-on-surface font-medium">Name</label>
          <input
            id="agent-name"
            autoFocus
            maxLength={NAME_MAX}
            className={`${inputBase} h-11 rounded-xl ${submitted && !nameValid ? 'border-error' : ''}`}
            placeholder="e.g. Enterprise Sales Copilot"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex items-center justify-between px-1 text-label-sm">
            <span className={`flex items-center gap-1 ${submitted && !nameValid ? 'text-error' : 'text-outline'}`}>
              <Icon name={nameValid ? 'check_circle' : 'info'} className={`text-[14px] ${nameValid ? 'text-rag-indexed' : ''}`} />
              Minimum {NAME_MIN} characters
            </span>
            <span className="text-outline font-mono text-code">{name.length} / {NAME_MAX}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-label-md text-on-surface font-medium">Model</span>
          <ModelSelect value={model} onChange={setModel} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="agent-role" className="text-label-md text-on-surface font-medium">Role (system prompt)</label>
            <span className="text-outline font-mono text-code">{role.length.toLocaleString()} / {ROLE_MAX.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap py-0.5">
            <span className="text-label-sm text-outline mr-1">Templates:</span>
            {ROLE_TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setRole(t.role)}
                className={`px-2 py-1 rounded-full text-label-sm flex items-center gap-1 border transition-colors ${role === t.role ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-surface-container-high border-surface-container-highest text-on-surface hover:bg-surface-container-highest'}`}
              >
                <Icon name={t.icon} className={`text-[14px] ${role === t.role ? '' : t.color}`} />
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            id="agent-role"
            rows={4}
            maxLength={ROLE_MAX}
            className={`${inputBase} rounded-xl resize-none leading-relaxed ${submitted && !roleValid ? 'border-error' : ''}`}
            placeholder="You are an assistant that..."
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          {submitted && !roleValid && <span className="text-error text-[12px]">Describe what the agent should do</span>}
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-surface-container text-body-sm text-on-surface-variant">
          <Icon name="verified" className="text-[18px] text-rag-indexed" />
          Every agent answers only from its documents, cites sources and says when it can&apos;t find an answer.
        </div>
      </form>
    </Modal>
  )
}

export default AddAgentModal
