'use client'
import React from "react"
import Icon from "../ui/icon"

type Props = {
  agentName: string
  streaming: boolean
  documentsCount: number
  scopeLabel: string
  onSend: (text: string) => void
  onStop: () => void
  onAttach: () => void
  onShowSources: () => void
}

const Composer = ({ agentName, streaming, documentsCount, scopeLabel, onSend, onStop, onAttach, onShowSources }: Props) => {
  const [text, setText] = React.useState('')
  const ref = React.useRef<HTMLTextAreaElement>(null)

  // grow with the content up to max-h
  React.useEffect(() => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = `${ref.current.scrollHeight}px`
  }, [text])

  const submit = () => {
    if (!text.trim() || streaming) return
    onSend(text.trim())
    setText('')
  }

  return (
    <div className="sticky bottom-0 z-20 w-full px-3 sm:px-6 pb-4 pt-2 bg-gradient-to-t from-surface via-surface/95 to-transparent">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        <div className="flex flex-col rounded-2xl bg-surface-container-low shadow-xl p-3 focus-within:bg-surface-container transition-colors">
          <textarea
            ref={ref}
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={`Ask ${agentName} anything about your documents...`}
            className="w-full bg-transparent text-on-surface placeholder:text-outline text-body-lg resize-none focus:outline-none min-h-[52px] max-h-48 leading-relaxed"
          />
          <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button type="button" title="Upload documents" aria-label="Upload documents" onClick={onAttach} className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors flex">
                <Icon name="attach_file" className="text-[16px]" />
              </button>
              <button type="button" onClick={onShowSources} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-sm transition-colors">
                <Icon name="folder_open" className="text-[16px] text-rag-indexed" />
                {documentsCount} doc{documentsCount === 1 ? '' : 's'} indexed
              </button>
            </div>
            {streaming ? (
              <button type="button" onClick={onStop} className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-bright text-label-md transition-colors">
                <Icon name="stop_circle" className="text-[18px] text-error" />
                Stop
              </button>
            ) : (
              <button type="button" aria-label="Send message" onClick={submit} disabled={!text.trim()} className="w-9 h-9 rounded-full bg-primary-container hover:bg-primary text-on-primary flex items-center justify-center transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:hover:bg-primary-container">
                <Icon name="arrow_upward" className="text-[20px]" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 px-1 text-outline text-label-sm">
          <span className="flex items-center gap-1 truncate">
            <Icon name="check_circle" className="text-[14px] text-rag-indexed" />
            Scoped to: {scopeLabel} • Strict grounding
          </span>
          <span className="hidden sm:inline shrink-0">Enter to send • Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  )
}

export default Composer
