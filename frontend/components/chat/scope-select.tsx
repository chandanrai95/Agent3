'use client'
import React from "react"
import { fileIcon } from "@/lib/utils/format"
import Icon from "../ui/icon"

type Props = {
  value: string
  onChange: (value: string) => void
  documents: Source[]
}

// restricts retrieval to one document, '' = all documents
const ScopeSelect = ({ value, onChange, documents }: Props) => {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const selected = documents.find((d) => d._id === value)

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 max-w-[220px] px-3 py-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-label-sm text-on-surface-variant shadow-sm transition-colors"
      >
        <Icon name="filter_alt" className="text-[14px] text-rag-indexed" />
        <span className="truncate text-on-surface">{selected ? selected.source_name : 'All sources'}</span>
        <Icon name="expand_more" className="text-[14px] text-outline" />
      </button>
      {open && (
        <ul role="listbox" className="absolute z-50 left-0 top-full mt-1 w-72 max-h-80 overflow-y-auto flex flex-col gap-1 p-1 rounded-xl bg-surface-container-low border border-surface-container-highest shadow-xl">
          {[{ _id: '', source_name: 'All sources' } as Source, ...documents].map((d) => {
            const icon = d._id ? fileIcon(d.source_name) : { icon: 'select_all' as const, color: 'text-rag-indexed' }
            return (
              <li
                key={d._id || 'all'}
                role="option"
                aria-selected={d._id === value}
                onClick={() => { onChange(d._id); setOpen(false) }}
                className={`flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer text-label-md transition-colors ${d._id === value ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant hover:bg-surface-container'}`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Icon name={icon.icon} className={`text-[16px] ${icon.color}`} />
                  <span className="truncate">{d.source_name}</span>
                </span>
                {d._id === value && <Icon name="check" className="text-[16px] text-primary" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default ScopeSelect
