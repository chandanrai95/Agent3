'use client'
import React from "react"
import { toast } from "react-toastify"
import { getWidget, PUBLIC_API_URL, rotateWidgetKey, saveWidget } from "@/lib/api/integrations"
import { errorMessage } from "@/lib/api/errors"
import Icon from "../ui/icon"
import Spinner from "../ui/spinner"
import { btnPrimary, btnSecondary, inputBase } from "../ui/styles"
import CodeBlock from "./code-block"
import Section from "./section"

declare global {
  interface Window { Agent3Widget?: { destroy: () => void } }
}

const removePreview = () => {
  window.Agent3Widget?.destroy()
  document.querySelectorAll('script[data-agent3-preview]').forEach((s) => s.remove())
}

const WidgetSettingsSection = ({ agentId }: { agentId: string }) => {
  const [widget, setWidget] = React.useState<WidgetSettings | null>(null)
  const [origins, setOrigins] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [rotating, setRotating] = React.useState(false)
  const [confirmRotate, setConfirmRotate] = React.useState(false)
  const [previewing, setPreviewing] = React.useState(false)

  React.useEffect(() => {
    getWidget(agentId)
      .then((w) => { setWidget(w); setOrigins(w.allowed_origins.join('\n')) })
      .catch((err) => toast(errorMessage(err), { type: 'error' }))
    return removePreview
  }, [agentId])

  if (!widget) {
    return <Section icon="widgets" title="Website chat widget" description="Loading..."><div className="flex justify-center text-outline"><Spinner /></div></Section>
  }

  const update = (change: Partial<WidgetSettings>) => setWidget((w) => (w ? { ...w, ...change } : w))
  const originList = origins.split(/[\n,]/).map((o) => o.trim()).filter(Boolean)
  const pageOrigin = typeof window !== 'undefined' ? window.location.origin : ''
  const previewAllowed = widget.enabled && !!widget.public_key && (widget.allowed_origins.length === 0 || widget.allowed_origins.includes(pageOrigin))

  const onSave = async (e?: React.FormEvent, enabled = widget.enabled) => {
    e?.preventDefault()
    try {
      setSaving(true)
      const saved = await saveWidget(agentId, {
        enabled, allowed_origins: originList, title: widget.title, greeting: widget.greeting, accent_color: widget.accent_color,
      })
      setWidget(saved)
      setOrigins(saved.allowed_origins.join('\n'))
      if (previewing) { removePreview(); setPreviewing(false) }
      toast(enabled ? 'Widget settings saved' : 'Widget turned off', { type: 'success' })
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const onRotate = async () => {
    if (!confirmRotate) return setConfirmRotate(true)
    try {
      setRotating(true)
      setWidget(await rotateWidgetKey(agentId))
      if (previewing) { removePreview(); setPreviewing(false) }
      toast('New widget key created, update the snippet on your website', { type: 'success' })
    } catch (err) {
      toast(errorMessage(err), { type: 'error' })
    } finally {
      setRotating(false)
      setConfirmRotate(false)
    }
  }

  const togglePreview = () => {
    if (previewing) {
      removePreview()
      setPreviewing(false)
      return
    }
    const script = document.createElement('script')
    script.src = `${PUBLIC_API_URL}/widget.js`
    script.async = true
    script.dataset.agentKey = widget.public_key || ''
    script.dataset.open = 'true'
    script.dataset.agent3Preview = 'true'
    document.body.appendChild(script)
    setPreviewing(true)
  }

  const snippet = `<script src="${PUBLIC_API_URL}/widget.js" data-agent-key="${widget.public_key || 'pk_...'}" async></script>`

  return (
    <Section
      icon="widgets"
      title="Website chat widget"
      description="Add a chat bubble to any website with one script tag. It uses a public key that only works on the domains you allow, conversations are kept per visitor and messages are rate limited."
      badge={
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-label-md text-on-surface-variant">{widget.enabled ? 'On' : 'Off'}</span>
          <button
            type="button"
            role="switch"
            aria-checked={widget.enabled}
            aria-label="Enable website widget"
            disabled={saving}
            onClick={() => { update({ enabled: !widget.enabled }); onSave(undefined, !widget.enabled) }}
            className={`relative w-11 h-6 rounded-full transition-colors ${widget.enabled ? 'bg-primary-container' : 'bg-surface-container-highest'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${widget.enabled ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </label>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSave}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="widget-title" className="text-label-md text-on-surface font-medium">Title</label>
          <input id="widget-title" maxLength={60} className={inputBase} value={widget.title} onChange={(e) => update({ title: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="widget-color" className="text-label-md text-on-surface font-medium">Accent color</label>
          <div className="flex items-center gap-2">
            <input id="widget-color" type="color" value={widget.accent_color} onChange={(e) => update({ accent_color: e.target.value })} className="w-11 h-10 rounded-lg bg-transparent border border-border-dark cursor-pointer" />
            <input aria-label="Accent color hex" className={`${inputBase} font-mono`} value={widget.accent_color} onChange={(e) => update({ accent_color: e.target.value })} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="widget-greeting" className="text-label-md text-on-surface font-medium">Greeting</label>
          <input id="widget-greeting" maxLength={300} className={inputBase} value={widget.greeting} onChange={(e) => update({ greeting: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="widget-origins" className="text-label-md text-on-surface font-medium">Allowed websites</label>
          <textarea
            id="widget-origins"
            rows={3}
            className={`${inputBase} font-mono resize-none`}
            placeholder={'https://www.example.com\nhttps://shop.example.com'}
            value={origins}
            onChange={(e) => setOrigins(e.target.value)}
          />
          {originList.length === 0 ? (
            <span className="flex items-start gap-1.5 text-body-sm text-rag-syncing">
              <Icon name="warning" className="text-[16px]" />
              Any website can embed the widget with your key and use your tokens. Add your domains, one per line.
            </span>
          ) : (
            <span className="text-body-sm text-outline">One origin per line: scheme + domain (+ port), no paths.</span>
          )}
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button type="submit" className={btnPrimary} disabled={saving}>
            {saving ? <Spinner /> : <Icon name="check" className="text-[18px]" />}
            Save widget
          </button>
        </div>
      </form>

      {widget.public_key && (
        <div className="flex flex-col gap-3">
          <span className="text-label-sm uppercase tracking-wider text-outline">Embed on your website, before &lt;/body&gt;</span>
          <CodeBlock tabs={[{ label: 'HTML', code: snippet }]} />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={onRotate}
              onMouseLeave={() => setConfirmRotate(false)}
              disabled={rotating}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md transition-colors ${confirmRotate ? 'bg-error-container text-white' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}
            >
              {rotating ? <Spinner /> : <Icon name="refresh" className="text-[16px]" />}
              {confirmRotate ? 'Old snippet stops working, confirm?' : 'New widget key'}
            </button>
            <div className="flex items-center gap-2">
              {!previewAllowed && widget.enabled && (
                <span className="text-body-sm text-outline">Add {pageOrigin} to allowed websites to preview here</span>
              )}
              <button type="button" className={btnSecondary} disabled={!previewAllowed} onClick={togglePreview}>
                <Icon name={previewing ? 'close' : 'play_arrow'} className="text-[18px]" />
                {previewing ? 'Close preview' : 'Preview on this page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Section>
  )
}

export default WidgetSettingsSection
