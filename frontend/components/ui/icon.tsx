type Props = {
  name: string
  className?: string
  filled?: boolean
}

const Icon = ({ name, className = '', filled }: Props) => (
  <span aria-hidden className={`material-symbols-outlined ${filled ? 'filled' : ''} ${className}`}>{name}</span>
)

export default Icon
