const Spinner = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <span aria-hidden className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${className}`} />
)

export default Spinner
