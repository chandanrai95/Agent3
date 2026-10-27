interface Thread {
  _id: string
  agent_id: string
  title?: string | null
  summary?: string | null
  created_at: string
  updated_at: string
}

interface SourceRef {
  source_id?: string | null
  source_name: string
  snippet: string
  score?: number | null
  page?: number | null
  pages?: number[]
  section?: string | null
  content_type?: string | null
}

interface ChatMessage {
  _id: string
  thread_id?: string
  role: 'user' | 'assistant'
  content: string
  sources: SourceRef[]
  created_at: string
  // client-only
  streaming?: boolean
  error?: string
  // free token limit reached, show a link to settings
  quotaExceeded?: boolean
}
