'use client'
import React from "react"
import { ACCEPTED_FILES } from "@/lib/utils/format"
import Icon from "../ui/icon"

type Props = {
  onFiles: (files: File[]) => void
  compact?: boolean
}

const DropZone = ({ onFiles, compact }: Props) => {
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={(e) => { e.preventDefault(); setDragging(false) }}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (e.dataTransfer.files?.length) onFiles(Array.from(e.dataTransfer.files))
      }}
      className={`group cursor-pointer rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all ${compact ? 'p-4 gap-1' : 'p-6 gap-1'} ${dragging ? 'border-primary bg-surface-container-highest' : 'border-outline-variant bg-surface-container/70 hover:border-primary/60 hover:bg-surface-container'}`}
    >
      <div className={`rounded-full bg-primary-container/20 text-primary flex items-center justify-center shadow-[0_0_24px_rgba(128,131,255,0.35)] group-hover:scale-105 transition-transform ${compact ? 'w-9 h-9 mb-1' : 'w-14 h-14 mb-2'}`}>
        <Icon name="cloud_upload" className={compact ? 'text-[20px]' : 'text-[32px]'} />
      </div>
      <p className={compact ? 'text-label-md text-on-surface' : 'text-headline-sm text-on-surface'}>
        {compact ? 'Drop documents here' : <>Drag &amp; drop your files here, or <span className="text-primary underline underline-offset-4 decoration-primary/40">browse files</span></>}
      </p>
      <p className="text-body-sm text-outline max-w-md">
        {compact ? 'PDF, DOCX, XLSX, CSV, TXT, images' : 'PDF, DOCX, XLSX, CSV, TXT, MD and images. Tables, images and scanned pages are read automatically.'}
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_FILES}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(Array.from(e.target.files))
          e.target.value = ''
        }}
      />
    </div>
  )
}

export default DropZone
