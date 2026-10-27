import axios from "axios"

export const getAgentHistoryByAgentId = async (id: string) => {
  try {
    const { data } = await axios.get(`/api/agents/${id}/agent-history`);
    return data;
  } catch(err) {
    console.error('getAgentHistoryByAgentId', err)
    return Promise.reject(err)
  }
}