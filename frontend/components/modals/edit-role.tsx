'use client'
import React from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import useAppStore from "@/store/useAppStore"
import { deleteAgent, updateAgent } from "@/lib/api/agents"
import { errorMessage } from "@/lib/api/errors"
import Modal from "../ui/modal"
import Icon from "../ui/icon"
import Spinner from "../ui/spinner"
import { btnPrimary, btnSecondary, inputBase } from "../ui/styles"
import { ROLE_TEMPLATES } from "./role-templates"

const ROLE_MAX = 4000

const EditRoleModal = ({ agent }: { agent: Agent }) => {
  const router = useRouter()
  const { closeModal } = useAppStore()
  const [role, setRole] = React.useState(agent.role || '')
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  const onSave = async () => {
    if (!role.trim()) {
      toast('The role can not be empty.', { type: 'error' })
      return
    }
    try {
      setSaving(true)
      await updateAgent({ id: agent._id, payload: { role: role.trim() } })
      toast('Role updated', { type: 'success' })
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
      router.replace('/')
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      icon="tune"
      title="Edit Agent Role"
      subtitle={<>Define persona, tone and boundaries for <span className="text-on-surface font-medium">{agent.name}</span></>}
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
            <button type="button" className={btnPrimary} onClick={onSave} disabled={saving}>
              {saving ? <Spinner /> : <Icon name="check" className="text-[18px]" />}
              Save role
            </button>
          </div>
        </>
      }
    >
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container border border-border-dark">
        <Icon name="lightbulb" className="text-primary text-[18px]" />
        <p className="text-body-sm text-on-surface-variant">Describe who the agent is, what it should answer, and its tone.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="system-prompt" className="text-label-md text-on-surface font-medium">Agent role &amp; instructions</label>
          <span className="font-mono text-code text-outline">{role.length.toLocaleString()} / {ROLE_MAX.toLocaleString()}</span>
        </div>
        <textarea
          id="system-prompt"
          rows={9}
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
    </Modal>
  )
}

export default EditRoleModal
