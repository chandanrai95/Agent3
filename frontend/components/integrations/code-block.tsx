'use client'
import React from "react"
import Icon from "../ui/icon"

export const useCopy = () => {
  const [copied, setCopied] = React.useState<string | null>(null)
  const copy = async (text: string, id = 'default') => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500)
  }
  return { copied, copy }
}

export const CopyButton = ({ text, label = 'Copy' }: { text: string, label?: string }) => {
  const { copied, copy } = useCopy()
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      className="flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container-high hover:bg-surface-container-highest text-label-sm text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
    >
      <Icon name={copied ? 'check' : 'content_copy'} className={`text-[14px] ${copied ? 'text-success' : ''}`} />
      {copied ? 'Copied' : label}
    </button>
  )
}

type Tab = { label: string, code: string }

// code snippet with optional language tabs and a copy button
const CodeBlock = ({ tabs }: { tabs: Tab[] }) => {
  const [active, setActive] = React.useState(0)
  const tab = tabs[active]
  return (
    <div className="rounded-xl bg-surface-container-lowest border border-border-dark overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-b border-border-dark">
        <div className="flex items-center gap-1" role="tablist">
          {tabs.map((t, i) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={`px-2 py-1 rounded-md text-label-sm transition-colors ${i === active ? 'bg-surface-container-high text-on-surface' : 'text-outline hover:text-on-surface'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <CopyButton text={tab.code} />
      </div>
      <pre className="p-3 overflow-x-auto text-code font-mono text-on-surface-variant leading-relaxed"><code>{tab.code}</code></pre>
    </div>
  )
}

export default CodeBlock
