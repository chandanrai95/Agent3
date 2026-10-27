import axios from "axios";

export const getSettings = async (): Promise<UserSettings> => {
  const { data } = await axios.get('/api/settings')
  return data
}

export const saveOpenAIKey = async (apiKey: string): Promise<UserSettings> => {
  const { data } = await axios.put('/api/settings/openai_key', { api_key: apiKey })
  return data
}

export const removeOpenAIKey = async (): Promise<UserSettings> => {
  const { data } = await axios.delete('/api/settings/openai_key')
  return data
}
