'use client'
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// "[1]" / "[2][3]" citations become links the renderer turns into chips
const linkCitations = (text: string) => text.replace(/\[(\d{1,2})\](?!\()/g, '[$1](#cite-$1)')

type Props = {
  content: string
  sources: SourceRef[]
}

const Markdown = ({ content, sources }: Props) => (
  <div className="prose-answer">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => {
          if (href?.startsWith('#cite-')) {
            const n = Number(href.slice(6))
            const source = sources[n - 1]
            return (
              <sup
                title={source ? `${source.source_name}${source.pages?.length ? ` • p. ${source.pages.join(', ')}` : ''}` : undefined}
                className="mx-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-primary-container/20 text-primary text-[10px] font-mono font-semibold no-underline align-super cursor-help"
              >
                {n}
              </sup>
            )
          }
          return <a href={href} target="_blank" rel="noreferrer">{children}</a>
        },
      }}
    >
      {linkCitations(content)}
    </ReactMarkdown>
  </div>
)

export default Markdown
