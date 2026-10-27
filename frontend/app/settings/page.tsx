'use client'
import React from "react"
import Link from "next/link"
import { toast } from "react-toastify"
import useAppStore from "@/store/useAppStore"
import { removeOpenAIKey, saveOpenAIKey } from "@/lib/api/settings"
import { errorMessage } from "@/lib/api/errors"
import { formatTokens, parseDate } from "@/lib/utils/format"
import UsageMeter from "@/components/settings/usage-meter"
import { PasswordToggle } from "@/components/auth/field"
import Icon from "@/components/ui/icon"
import Spinner from "@/components/ui/spinner"
import { btnPrimary, inputBase } from "@/components/ui/styles"

const KIND_LABELS: Record<string, string> = {
  chat: 'Answers', rewrite: 'Follow-up rewriting', summary: 'Conversation memory', embeddings: 'Embeddings (search & uploads)', vision: 'Images & scanned pages',
}

const formatDay = (date: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(parseDate(date))

export default function SettingsPage() {
  const { settings, setSettings, refreshSettings } = useAppStore()
  const [apiKey, setApiKey] = React.useState('')
  const [showKey, setShowKey] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [removing, setRemoving] = React.useState(false)
  const [confirmRemove, setConfirmRemove] = React.useState(false)

  React.useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim().startsWith('sk-')) {
      toast('OpenAI API keys start with "sk-".', { type: 'error' })
      return
    }
    try {
      setSaving(true)
      setSettings(await saveOpenAIKey(apiKey.trim()))
      setApiKey('')
      setShowKey(false)
      toast('API key verified and saved', { type: 'success' })
    } catch (err) {
      toast(errorMessage(err, 'Could not save the key.'), { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const onRemove = async () => {
    if (!confirmRemove) return setConfirmRemove(true)
    try {
      setRemoving(true)
      setSettings(await removeOpenAIKey())
      toast('API key removed, you are back on the free tier', { type: 'success' })
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
    } finally {
      setRemoving(false)
      setConfirmRemove(false)
    }
  }

  const usage = settings?.usage
  const kinds = Object.entries(usage?.by_kind || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Link href="/" className="flex items-center gap-1 text-label-md text-outline hover:text-on-surface w-fit mb-2">
            <Icon name="arrow_back" className="text-[16px]" />Back
          </Link>
          <h1 className="text-headline-lg font-semibold tracking-tight text-on-surface">Settings</h1>
          <p className="text-body-md text-on-surface-variant">Bring your own OpenAI key, or use the free monthly allowance.</p>
        </div>

        {!settings && <div className="flex justify-center py-10 text-outline"><Spinner className="w-5 h-5" /></div>}

        {settings && usage && (
          <>
            <section className="rounded-2xl bg-surface-container-low p-5 sm:p-6 flex flex-col gap-5 shadow-md">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center">
                    <Icon name="key" className="text-[22px]" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-headline-sm text-on-surface">OpenAI API key</h2>
                    <p className="text-body-sm text-on-surface-variant max-w-md">
                      With your own key every answer, upload and search for your agents runs on your OpenAI account, without the free token limit.
                    </p>
                  </div>
                </div>
                {settings.has_openai_key ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 text-success text-label-sm font-medium">
                    <Icon name="check_circle" className="text-[14px]" />Using your key
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface-variant text-label-sm font-medium">
                    <Icon name="bolt" className="text-[14px] text-rag-syncing" />Free tier
                  </span>
                )}
              </div>

              {settings.has_openai_key && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-container flex-wrap">
                  <div className="flex flex-col">
                    <span className="font-mono text-body-md text-on-surface">{settings.openai_key_hint}</span>
                    {settings.openai_key_updated_at && (
                      <span className="text-label-sm text-outline">Saved {formatDay(settings.openai_key_updated_at)}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onRemove}
                    onMouseLeave={() => setConfirmRemove(false)}
                    disabled={removing}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-medium transition-colors ${confirmRemove ? 'bg-error-container text-white' : 'bg-surface-container-high text-error hover:bg-error-container hover:text-white'}`}
                  >
                    {removing ? <Spinner /> : <Icon name="delete" className="text-[16px]" />}
                    {confirmRemove ? 'Click again to remove' : 'Remove key'}
                  </button>
                </div>
              )}

              <form className="flex flex-col gap-2" onSubmit={onSave}>
                <label htmlFor="openai-key" className="text-label-md text-on-surface font-medium">
                  {settings.has_openai_key ? 'Replace key' : 'Add your key'}
                </label>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <div className="relative flex-1 flex items-center">
                    <input
                      id="openai-key"
                      type={showKey ? 'text' : 'password'}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className={`${inputBase} font-mono pr-10`}
                    />
                    <div className="absolute right-2 flex"><PasswordToggle shown={showKey} onToggle={() => setShowKey((s) => !s)} /></div>
                  </div>
                  <button type="submit" className={btnPrimary} disabled={saving || !apiKey.trim()}>
                    {saving ? <Spinner /> : <Icon name="check" className="text-[18px]" />}
                    {saving ? 'Verifying...' : 'Verify & save'}
                  </button>
                </div>
                <p className="flex items-start gap-1.5 text-body-sm text-outline">
                  <Icon name="lock" className="text-[16px] text-rag-indexed mt-px shrink-0" />
                  <span>
                    The key is checked with OpenAI, stored encrypted and never shown again; only its last characters are displayed.
                    Create one at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">platform.openai.com/api-keys</a>.
                  </span>
                </p>
              </form>
            </section>

            <section className="rounded-2xl bg-surface-container-low p-5 sm:p-6 flex flex-col gap-5 shadow-md">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex flex-col">
                  <h2 className="text-headline-sm text-on-surface">Token usage</h2>
                  <p className="text-body-sm text-on-surface-variant">
                    {usage.limit === null
                      ? 'Billed to your OpenAI account, no limit applies.'
                      : `Without your own key you get ${formatTokens(usage.limit)} free tokens in total. The allowance does not reset.`}
                  </p>
                </div>
                <span className="font-mono text-headline-sm text-on-surface">{usage.tokens.toLocaleString()}<span className="text-body-sm text-outline"> tokens used</span></span>
              </div>

              <UsageMeter usage={usage} />

              {usage.limit !== null && usage.free_tokens_used >= usage.limit && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-error-container/30 text-error text-body-sm">
                  <Icon name="warning" className="text-[18px]" />
                  Your free tokens are used up. Chats, uploads and integrations stay paused until you add your own OpenAI key above.
                </div>
              )}

              {kinds.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-label-sm uppercase tracking-wider text-outline">All-time usage by type</span>
                  {kinds.map(([kind, n]) => (
                    <div key={kind} className="flex items-center justify-between text-body-md">
                      <span className="text-on-surface-variant">{KIND_LABELS[kind] || kind}</span>
                      <span className="font-mono text-on-surface">{n.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
