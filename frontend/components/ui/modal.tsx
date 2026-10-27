'use client'
import React from "react"
import Icon from "./icon"
import type { IconName } from "./icon-names"
import { btnGhostIcon } from "./styles"

type Props = {
  title: string
  subtitle?: React.ReactNode
  eyebrow?: string
  icon?: IconName
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'md' | 'lg'
}

const Modal = ({ title, subtitle, eyebrow, icon, onClose, children, footer, size = 'md' }: Props) => {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-surface-dark/80 backdrop-blur-md overflow-y-auto"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${size === 'lg' ? 'max-w-2xl' : 'max-w-xl'} my-auto rounded-2xl bg-surface-container-low shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden`}
      >
        <div className="h-1 w-full bg-gradient-to-r from-primary-container via-primary to-secondary" />
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-24 bg-primary-container/20 blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4 p-6 pb-4">
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <div className="w-9 h-9 shrink-0 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <Icon name={icon} className="text-[22px]" />
              </div>
            )}
            <div className="flex flex-col gap-0.5 min-w-0">
              {eyebrow && <span className="text-label-sm uppercase tracking-widest text-primary font-semibold">{eyebrow}</span>}
              <h2 className="text-headline-md font-semibold text-on-surface">{title}</h2>
              {subtitle && <div className="text-body-sm text-on-surface-variant">{subtitle}</div>}
            </div>
          </div>
          <button type="button" aria-label="Close dialog" className={`${btnGhostIcon} bg-surface-container shrink-0`} onClick={onClose}>
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>

        <div className="relative px-6 pb-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">{children}</div>

        {footer && (
          <div className="relative px-6 py-4 bg-surface-container flex items-center justify-between gap-3 flex-wrap">{footer}</div>
        )}
      </div>
    </div>
  )
}

export default Modal
