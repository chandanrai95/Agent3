'use client'
import React from "react"
import { toast } from "react-toastify"
import { createApiKey, getApiKeys, revokeApiKey } from "@/lib/api/integrations"
import { errorMessage } from "@/lib/api/errors"
import { timeAgo } from "@/lib/utils/format"
import Icon from "../ui/icon"
import Spinner from "../ui/spinner"
import { btnPrimary, inputBase } from "../ui/styles"
import { CopyButton } from "./code-block"
import Section from "./section"

const ApiKeys = ({ agentId, onCreated }: { agentId: string, onCreated: (key: string) => void }) => {
  const [keys, setKeys] = React.useState<ApiKey[] | null>(null)
  const [name, setName] = React.useState('')
  const [creating, setCreating] = React.useState(false)
  const [newKey, setNewKey] = React.useState<string | null>(null)
  const [confirmRevoke, setConfirmRevoke] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    try {
      setKeys(await getApiKeys(agentId))
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
      setKeys([])
    }
  }, [agentId])

  React.useEffect(() => { load() }, [load])

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setCreating(true)
      const created = await createApiKey(agentId, name.trim() || 'default')
      setNewKey(created.key)
      onCreated(created.key)
      setName('')
      load()
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
    } finally {
      setCreating(false)
    }
  }

  const onRevoke = async (key: ApiKey) => {
    if (confirmRevoke !== key._id) return setConfirmRevoke(key._id)
    try {
      await revokeApiKey(agentId, key._id)
      toast(`Key "${key.name}" revoked`, { type: 'success' })
      load()
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
    } finally {
      setConfirmRevoke(null)
    }
  }

  const active = (keys || []).filter((k) => !k.revoked)

  return (
    <Section
      icon="key"
      title="API keys"
      description="Secret keys for servers and platforms. Use them for the OpenAI-compatible endpoint and the REST API, never in a browser or app bundle."
    >
      {newKey && (
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-success/10 border border-success/30">
          <span className="flex items-center gap-1.5 text-label-md text-success font-medium">
            <Icon name="check_circle" className="text-[16px]" />
            Copy your new key now, it won&apos;t be shown again
          </span>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate px-2 py-1.5 rounded-md bg-surface-container-lowest font-mono text-code text-on-surface">{newKey}</code>
            <CopyButton text={newKey} />
          </div>
        </div>
      )}

      <form onSubmit={onCreate} className="flex gap-2 flex-col sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="Key name, e.g. Botpress production"
          aria-label="New API key name"
          className={`${inputBase} flex-1`}
        />
        <button type="submit" className={btnPrimary} disabled={creating}>
          {creating ? <Spinner /> : <Icon name="add" className="text-[18px]" />}
          Create key
        </button>
      </form>

      <div className="flex flex-col gap-1.5">
        {keys === null && <div className="flex justify-center py-3 text-outline"><Spinner /></div>}
        {keys && active.length === 0 && <p className="text-body-sm text-outline">No active keys yet.</p>}
        {active.map((key) => (
          <div key={key._id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-container" onMouseLeave={() => setConfirmRevoke(null)}>
            <div className="flex flex-col min-w-0">
              <span className="text-label-md text-on-surface truncate">{key.name}</span>
              <span className="text-body-sm text-outline font-mono truncate">
                {key.prefix}••••  ·  created {timeAgo(key.created_at)}  ·  {key.last_used_at ? `used ${timeAgo(key.last_used_at)} ago` : 'never used'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onRevoke(key)}
              className={`px-2.5 py-1 rounded-lg text-label-sm font-medium transition-colors shrink-0 ${confirmRevoke === key._id ? 'bg-error-container text-white' : 'text-error hover:bg-surface-container-highest'}`}
            >
              {confirmRevoke === key._id ? 'Click to revoke' : 'Revoke'}
            </button>
          </div>
        ))}
      </div>
    </Section>
  )
}

export default ApiKeys
