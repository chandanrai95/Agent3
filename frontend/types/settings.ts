interface Usage {
  // all-time totals
  tokens: number
  // tokens spent on the platform key, counted against the free allowance
  free_tokens_used: number
  by_kind: Record<string, number>
  // free allowance, never resets; null = unlimited, the user pays with their own OpenAI key
  limit: number | null
}

interface UserSettings {
  has_openai_key: boolean
  openai_key_hint?: string | null
  openai_key_updated_at?: string | null
  usage: Usage
}
