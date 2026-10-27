'use client'
import React from "react"
import { chatModels, getModel } from "@/lib/utils/model"
import Icon from "./icon"
import Spinner from "./spinner"

type Props = {
  value: string
  onChange: (value: string) => void
  variant?: 'field' | 'pill'
  loading?: boolean
  align?: 'left' | 'right'
  direction?: 'down' | 'up'
}

const ModelSelect = ({ value, onChange, variant = 'field', loading, align = 'left', direction = 'down' }: Props) => {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const selected = getModel(value)

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const pick = (v: string) => {
    setOpen(false)
    if (v !== value) onChange(v)
  }

  return (
    <div className="relative" ref={ref}>
      {variant === 'field' ? (
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container border border-surface-container-highest hover:bg-surface-container-high transition-colors text-left"
        >
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${selected.dot}`} />
            <span className="flex flex-col">
              <span className="text-label-md text-on-surface font-medium">{selected.label}</span>
              <span className="text-label-sm text-on-surface-variant">{selected.description}</span>
            </span>
          </span>
          <Icon name="expand_more" className={`text-[20px] text-outline transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={loading}
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-label-sm font-medium shadow-sm transition-colors ${selected.color}`}
        >
          {loading ? <Spinner className="w-3 h-3" /> : <span className={`w-2 h-2 rounded-full ${selected.dot}`} />}
          {selected.value}
          <Icon name="expand_more" className="text-[14px] text-outline" />
        </button>
      )}

      {open && (
        <ul
          role="listbox"
          className={`absolute z-50 ${variant === 'field' ? 'w-full' : 'w-72'} ${align === 'right' ? 'right-0' : 'left-0'} ${direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'} flex flex-col gap-1 p-1 rounded-xl bg-surface-container-low border border-surface-container-highest shadow-xl`}
        >
          {chatModels.map((m) => (
            <li
              key={m.value}
              role="option"
              aria-selected={m.value === value}
              onClick={() => pick(m.value)}
              className={`flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer transition-colors ${m.value === value ? 'bg-surface-container-high' : 'hover:bg-surface-container'}`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className={`px-1.5 py-0.5 rounded bg-surface-container-highest text-label-sm font-semibold font-mono ${m.color}`}>{m.value}</span>
                <span className="text-label-sm text-on-surface-variant truncate">{m.description}</span>
              </span>
              {m.value === value && <Icon name="check" className="text-[18px] text-primary" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ModelSelect
