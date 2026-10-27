import axios from "axios";

export const getApiKeys = async (agentId: string): Promise<ApiKey[]> => {
  const { data } = await axios.get(`/api/agents/${agentId}/api_keys`)
  return data
}

export const createApiKey = async (agentId: string, name: string): Promise<ApiKey & { key: string }> => {
  const { data } = await axios.post(`/api/agents/${agentId}/api_keys`, { name })
  return data
}

export const revokeApiKey = async (agentId: string, keyId: string) => {
  const { data } = await axios.delete(`/api/agents/${agentId}/api_keys/${keyId}`)
  return data
}

export const getWidget = async (agentId: string): Promise<WidgetSettings> => {
  const { data } = await axios.get(`/api/agents/${agentId}/widget`)
  return data
}

export const saveWidget = async (agentId: string, widget: Omit<WidgetSettings, 'public_key'>): Promise<WidgetSettings> => {
  const { data } = await axios.put(`/api/agents/${agentId}/widget`, widget)
  return data
}

export const rotateWidgetKey = async (agentId: string): Promise<WidgetSettings> => {
  const { data } = await axios.post(`/api/agents/${agentId}/widget/rotate`)
  return data
}

// public URL of the backend, used in snippets for other platforms
export const PUBLIC_API_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')
