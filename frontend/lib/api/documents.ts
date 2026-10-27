import axios from "axios";

export const getAgentDocuments = async (agentId: string): Promise<Source[]> => {
  const { data } = await axios.get(`/api/agents/${agentId}/documents`)
  return data
}

export const uploadDocument = async ({ agentId, file, onProgress, signal }: {
  agentId: string,
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
}): Promise<Source> => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await axios.post(`/api/agents/${agentId}/documents`, formData, {
    signal,
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    }
  })
  return data
}

export const deleteDocument = async ({ agentId, sourceId }: { agentId: string, sourceId: string }) => {
  const { data } = await axios.delete(`/api/agents/${agentId}/documents/${sourceId}`)
  return data
}
