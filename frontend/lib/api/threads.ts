import axios from "axios";

export const getThreads = async (agentId: string, limit = 100): Promise<Thread[]> => {
  const { data } = await axios.get(`/api/agents/${agentId}/threads`, { params: { limit } })
  return Array.isArray(data) ? data : []
}

export const renameThread = async (agentId: string, threadId: string, title: string): Promise<Thread> => {
  const { data } = await axios.patch(`/api/agents/${agentId}/threads/${threadId}`, { title })
  return data
}

export const deleteThread = async (agentId: string, threadId: string) => {
  const { data } = await axios.delete(`/api/agents/${agentId}/threads/${threadId}`)
  return data
}

export const createThread = async (agentId: string, title?: string): Promise<Thread> => {
  const { data } = await axios.post(`/api/agents/${agentId}/threads`, { title })
  return data
}

export const getThreadMessages = async (agentId: string, threadId: string): Promise<ChatMessage[]> => {
  const { data } = await axios.get(`/api/agents/${agentId}/threads/${threadId}/messages`)
  return data
}

type StreamEvent =
  | { type: 'token', content: string }
  | { type: 'sources', sources: SourceRef[] }
  | { type: 'done', message_id: string, answer: string, sources: SourceRef[], created_at: string }
  | { type: 'error', detail: string }

// POST a message and read the server-sent events (token / sources / done / error)
export const streamThreadMessage = async ({ agentId, threadId, message, sourceIds, signal, onEvent }: {
  agentId: string,
  threadId: string,
  message: string,
  sourceIds?: string[],
  signal?: AbortSignal,
  onEvent: (event: StreamEvent) => void
}) => {
  const response = await fetch(`/api/agents/${agentId}/threads/${threadId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, stream: true, source_ids: sourceIds?.length ? sourceIds : null }),
    signal,
  })
  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => null)
    throw { status: response.status, ...(data || { detail: 'Something went wrong.' }) }
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() || ''
    for (const raw of events) {
      const data = raw.split('\n').find((line) => line.startsWith('data: '))
      if (data) onEvent(JSON.parse(data.slice(6)))
    }
  }
}
