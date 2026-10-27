import Icon from "../ui/icon"
import Logo from "../ui/logo"
import type { IconName } from "../ui/icon-names"

const features: { icon: IconName, color: string, label: string }[] = [
  { icon: 'format_quote', color: 'text-rag-indexed', label: 'Answers cite their sources' },
  { icon: 'table_chart', color: 'text-primary', label: 'Reads tables, images & scans' },
  { icon: 'api', color: 'text-tertiary', label: 'Embed agents via API keys' },
]

const BrandPanel = () => (
  <div className="relative hidden lg:flex flex-1 bg-surface-container-lowest flex-col justify-between gap-8 p-14 overflow-hidden border-r border-border-dark min-h-screen">
    <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-container/20 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-tertiary-container/15 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

    <div className="relative z-10">
      <Logo />
    </div>

    <div className="relative z-10 my-auto flex flex-col gap-6 max-w-lg">
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-primary text-label-sm w-fit border border-border-dark">
          <span className="h-2 w-2 rounded-full bg-rag-indexed animate-pulse" />
          Retrieval-augmented answers you can verify
        </div>
        <h2 className="text-display font-semibold tracking-tight text-on-surface">
          Build AI agents that know your documents
        </h2>
        <p className="text-body-lg text-on-surface-variant">
          Upload PDFs, Word files and spreadsheets, give your agent a role, and get answers grounded in your own content.
        </p>
      </div>

      <div className="rounded-xl bg-surface-container-low/90 backdrop-blur-md border border-border-dark p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-border-dark/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary-container/20 flex items-center justify-center text-primary">
              <Icon name="smart_toy" className="text-[14px]" />
            </div>
            <span className="text-label-md text-on-surface">Contract Reviewer</span>
          </div>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-container text-rag-indexed">gpt-4.1-mini</span>
        </div>
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          &ldquo;Either party may terminate with 60 days written notice. [1]&rdquo;
        </p>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-high text-[12px] font-mono text-primary border border-border-dark">
          <Icon name="verified" className="text-[13px] text-rag-indexed" />
          MSA_Contract.pdf
          <span className="text-outline">•</span>
          <span className="text-on-surface-variant">p. 8</span>
        </div>
      </div>
    </div>

    <div className="relative z-10 pt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-outline text-label-sm border-t border-border-dark/60">
      {features.map((f) => (
        <div key={f.label} className="flex items-center gap-1.5">
          <Icon name={f.icon} className={`text-[16px] ${f.color}`} />
          {f.label}
        </div>
      ))}
    </div>
  </div>
)

export default BrandPanel
