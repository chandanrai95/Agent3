import { PUBLIC_API_URL } from "@/lib/api/integrations"
import CodeBlock, { CopyButton } from "./code-block"
import Section from "./section"

const PLATFORMS = ['Botpress', 'Typebot', 'Flowise', 'n8n', 'LibreChat', 'Open WebUI', 'LangChain', 'Vercel AI SDK']

const OpenAICompat = ({ agentId, apiKey }: { agentId: string, apiKey?: string | null }) => {
  const baseUrl = `${PUBLIC_API_URL}/v1`
  const model = `agent-${agentId}`
  const key = apiKey || 'ak_your_key'

  const tabs = [
    {
      label: 'cURL',
      code: `curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "${model}", "messages": [{"role": "user", "content": "What is your return policy?"}]}'`,
    },
    {
      label: 'Python',
      code: `from openai import OpenAI

client = OpenAI(base_url="${baseUrl}", api_key="${key}")
reply = client.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "What is your return policy?"}],
)
print(reply.choices[0].message.content)`,
    },
    {
      label: 'JavaScript',
      code: `import OpenAI from "openai";

const client = new OpenAI({ baseURL: "${baseUrl}", apiKey: "${key}" });
const stream = await client.chat.completions.create({
  model: "${model}",
  messages: [{ role: "user", content: "What is your return policy?" }],
  stream: true,
});
for await (const chunk of stream) process.stdout.write(chunk.choices[0]?.delta?.content ?? "");`,
    },
  ]

  const fields = [
    { label: 'Base URL', value: baseUrl },
    { label: 'Model', value: model },
    { label: 'API key', value: apiKey || 'Create a key above' },
  ]

  return (
    <Section
      icon="hub"
      title="OpenAI-compatible API"
      description="Plug the agent into any tool that supports a custom OpenAI endpoint. Answers come from the agent's documents with its role; send the whole conversation in messages, like with OpenAI."
    >
      <div className="grid gap-2">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-container">
            <span className="w-20 shrink-0 text-label-sm text-outline uppercase tracking-wider">{f.label}</span>
            <code className="flex-1 min-w-0 truncate font-mono text-code text-on-surface">{f.value}</code>
            {(f.label !== 'API key' || apiKey) && <CopyButton text={f.value} />}
          </div>
        ))}
      </div>

      <CodeBlock tabs={tabs} />

      <div className="flex flex-col gap-2">
        <span className="text-label-sm uppercase tracking-wider text-outline">Works with</span>
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => (
            <span key={p} className="px-2 py-0.5 rounded-full bg-surface-container text-label-sm text-on-surface-variant">{p}</span>
          ))}
          <span className="px-2 py-0.5 text-label-sm text-outline">and anything built on the OpenAI SDKs</span>
        </div>
        <p className="text-body-sm text-outline">
          Responses also include a <code className="font-mono text-code text-on-surface-variant">sources</code> field with the documents used.
          System messages from the caller are ignored; the agent&apos;s own role always applies.
        </p>
      </div>
    </Section>
  )
}

export default OpenAICompat
