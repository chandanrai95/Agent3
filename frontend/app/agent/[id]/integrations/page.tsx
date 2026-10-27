'use client'
import React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getAgentById } from "@/lib/api/agents"
import { PUBLIC_API_URL } from "@/lib/api/integrations"
import ApiKeys from "@/components/integrations/api-keys"
import OpenAICompat from "@/components/integrations/openai-compat"
import WidgetSettingsSection from "@/components/integrations/widget-settings"
import Section from "@/components/integrations/section"
import CodeBlock from "@/components/integrations/code-block"
import Icon from "@/components/ui/icon"
import Spinner from "@/components/ui/spinner"

export default function IntegrationsPage() {
  const { id } = useParams<{ id: string }>()
  const [agent, setAgent] = React.useState<Agent | null>(null)
  // the key created in this visit, filled into the snippets
  const [apiKey, setApiKey] = React.useState<string | null>(null)

  React.useEffect(() => {
    getAgentById(id).then(setAgent).catch(() => setAgent(null))
  }, [id])

  const restExample = `# conversations per end user, documents per conversation
curl -X POST ${PUBLIC_API_URL}/v1/threads -H "X-API-Key: ${apiKey || 'ak_your_key'}" \\
  -H "Content-Type: application/json" -d '{"title": "Order help", "external_user_id": "user-42"}'

curl -X POST ${PUBLIC_API_URL}/v1/threads/THREAD_ID/messages -H "X-API-Key: ${apiKey || 'ak_your_key'}" \\
  -H "Content-Type: application/json" -d '{"message": "Where is my order?", "stream": false}'`

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Link href={`/agent/${id}`} className="flex items-center gap-1 text-label-md text-outline hover:text-on-surface w-fit mb-2">
            <Icon name="arrow_back" className="text-[16px]" />Back to chat
          </Link>
          <h1 className="text-headline-lg font-semibold tracking-tight text-on-surface flex items-center gap-2 flex-wrap">
            Integrations
            {agent ? <span className="text-on-surface-variant font-normal">· {agent.name}</span> : <Spinner className="w-4 h-4 text-outline" />}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Use this agent outside Agent Builder: in chatbot builders and automation tools, in your own backend, or as a chat bubble on your website.
            Usage counts against your account and your OpenAI key when set.
          </p>
        </div>

        <ApiKeys agentId={id} onCreated={setApiKey} />
        <OpenAICompat agentId={id} apiKey={apiKey} />
        <WidgetSettingsSection agentId={id} />

        <Section
          icon="code"
          title="REST API with conversations"
          description="When the platform should keep history for you: create a thread per end user, upload documents into it and send messages. Answers stream with stream: true."
        >
          <CodeBlock tabs={[{ label: 'cURL', code: restExample }]} />
          <a href={`${PUBLIC_API_URL}/docs#/public`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-label-md text-primary hover:underline w-fit">
            Full API reference<Icon name="open_in_new" className="text-[14px]" />
          </a>
        </Section>
      </div>
    </div>
  )
}
