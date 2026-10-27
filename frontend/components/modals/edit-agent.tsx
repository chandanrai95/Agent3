'use client'
import React from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "react-toastify"
import useAppStore from "@/store/useAppStore"
import { deleteAgent, updateAgent } from "@/lib/api/agents"
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

const EditAgentModal = ({ agent }: { agent: Agent }) => {
  const router = useRouter()
  const params = useParams<{ id?: string }>()
  const { closeModal } = useAppStore()
  const [name, setName] = React.useState(agent.name || '')
  const [model, setModel] = React.useState(agent.model || 'gpt-4.1-mini')
  const [role, setRole] = React.useState(agent.role || '')
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  const nameValid = name.trim().length >= NAME_MIN
  const changed = name.trim() !== agent.name || model !== agent.model || role.trim() !== agent.role

  const onSave = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!nameValid) return toast(`Name must be at least ${NAME_MIN} characters.`, { type: 'error' })
    if (!role.trim()) return toast('The role can not be empty.', { type: 'error' })
    try {
      setSaving(true)
      await updateAgent({ id: agent._id, payload: { name: name.trim(), model, role: role.trim() } })
      toast('Agent updated', { type: 'success' })
      dispatchEvent(new Event('agent_updated'))
      dispatchEvent(new Event('agents_updated'))
      closeModal()
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    try {
      setDeleting(true)
      await deleteAgent(agent._id)
      toast(`${agent.name} was deleted`, { type: 'success' })
      dispatchEvent(new Event('agents_updated'))
      closeModal()
      if (params?.id === agent._id) router.replace('/')
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      icon="tune"
      title="Edit Agent"
      subtitle="Change the name, model and role. Documents and conversations are kept."
      onClose={closeModal}
      footer={
        <>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            onMouseLeave={() => setConfirmDelete(false)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-label-md font-medium transition-colors ${confirmDelete ? 'bg-error-container text-white' : 'bg-surface-container-high text-error hover:bg-error-container hover:text-white'}`}
          >
            {deleting ? <Spinner /> : <Icon name="delete" className="text-[16px]" />}
            {confirmDelete ? 'Click again to delete' : 'Delete agent'}
          </button>
          <div className="flex items-center gap-2">
            <button type="button" className={btnSecondary} onClick={closeModal}>Cancel</button>
            <button type="submit" form="edit-agent-form" className={btnPrimary} disabled={saving || !changed}>
              {saving ? <Spinner /> : <Icon name="check" className="text-[18px]" />}
              Save changes
            </button>
          </div>
        </>
      }
    >
      <form id="edit-agent-form" className="flex flex-col gap-5" onSubmit={onSave} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-agent-name" className="text-label-md text-on-surface font-medium">Name</label>
          <input
            id="edit-agent-name"
            maxLength={NAME_MAX}
            className={`${inputBase} h-11 rounded-xl ${!nameValid ? 'border-error' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex items-center justify-between px-1 text-label-sm">
            <span className={!nameValid ? 'text-error' : 'text-outline'}>Minimum {NAME_MIN} characters</span>
            <span className="text-outline font-mono text-code">{name.length} / {NAME_MAX}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-label-md text-on-surface font-medium">Model</span>
          <ModelSelect value={model} onChange={setModel} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="edit-agent-role" className="text-label-md text-on-surface font-medium">Role &amp; instructions</label>
            <span className="font-mono text-code text-outline">{role.length.toLocaleString()} / {ROLE_MAX.toLocaleString()}</span>
          </div>
          <textarea
            id="edit-agent-role"
            rows={7}
            maxLength={ROLE_MAX}
            className={`${inputBase} bg-surface-container-lowest rounded-xl resize-none leading-relaxed`}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-label-sm text-outline mr-1">Presets:</span>
            {ROLE_TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setRole(t.role)}
                className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant hover:text-on-surface text-label-sm flex items-center gap-1 transition-colors"
              >
                <Icon name="auto_fix_high" className="text-[12px]" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest">
          <div className="flex flex-col">
            <span className="text-label-md text-on-surface">Strict document grounding</span>
            <span className="text-body-sm text-outline">Answers come only from indexed documents, with citations</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-high">
            <span className="w-1.5 h-1.5 rounded-full bg-rag-indexed" />
            <span className="text-label-sm text-on-surface-variant">Always on</span>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default EditAgentModal
