interface Usage {
  period: string
  tokens: number
  by_kind: Record<string, number>
  // null = unlimited, the user pays with their own OpenAI key
  limit: number | null
  resets_at: string
}

interface UserSettings {
  has_openai_key: boolean
  openai_key_hint?: string | null
  openai_key_updated_at?: string | null
  usage: Usage
}
