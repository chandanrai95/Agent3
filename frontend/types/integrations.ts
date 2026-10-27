interface ApiKey {
  _id: string
  agent_id: string
  name: string
  prefix: string
  revoked: boolean
  last_used_at?: string | null
  created_at: string
}

interface WidgetSettings {
  enabled: boolean
  allowed_origins: string[]
  title: string
  greeting: string
  accent_color: string
  public_key?: string | null
}
