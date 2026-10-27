import axios from "axios";

export const getSourcesByAgentId = async (id: string) => {
  try {

    const { data } = await axios.get(`/api/agents/${id}/sources`)
    return data
  } catch (err) {
    console.error('getSourcesByAgentId', err);
    return Promise.reject(err)
  }
}