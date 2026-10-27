import React from "react"
import Icon from "../ui/icon"
import type { IconName } from "../ui/icon-names"
import { inputBase, inputError } from "../ui/styles"

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon: IconName
  hint?: React.ReactNode
  error?: string | null
  trailing?: React.ReactNode
}

const Field = ({ label, icon, hint, error, trailing, id, ...input }: Props) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-label-md font-medium text-on-surface flex items-center justify-between">
      <span>{label}</span>
      {hint}
    </label>
    <div className="relative flex items-center">
      <Icon name={icon} className={`absolute left-3 text-[18px] pointer-events-none ${error ? 'text-error' : 'text-outline'}`} />
      <input
        id={id}
        aria-invalid={!!error}
        className={`${inputBase} pl-10 ${trailing ? 'pr-10' : ''} ${error ? inputError : ''}`}
        {...input}
      />
      {trailing && <div className="absolute right-2 flex items-center">{trailing}</div>}
    </div>
    {error && (
      <div className="flex items-center gap-1.5 text-error text-[12px]">
        <Icon name="warning" className="text-[14px]" />
        {error}
      </div>
    )}
  </div>
)

export const PasswordToggle = ({ shown, onToggle }: { shown: boolean, onToggle: () => void }) => (
  <button
    type="button"
    aria-label={shown ? 'Hide password' : 'Show password'}
    className="p-1 rounded text-outline hover:text-on-surface transition-colors flex"
    onClick={onToggle}
  >
    <Icon name={shown ? 'visibility_off' : 'visibility'} className="text-[18px]" />
  </button>
)

export default Field
