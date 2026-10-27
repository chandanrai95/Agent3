import axios, { AxiosError } from "axios";

export const getUserAgents = async () => {
  try {
    const { data } = await axios.get('/api/agents')

    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error('getUserAgents error', err);
    return Promise.reject(err)
  }
}

export const getAgentById = async (id: string | null) => {
  try {
    const { data } = await axios.get(`/api/agents/${id}`)
    return data
  } catch (err) {
    console.error('getAgentId', err);
    return Promise.reject(err)
  }
}

export const addAgent = async ({ name, model, role }: { name: string, model: string, role: string }) => {
  try {
    const { data } = await axios.post('/api/agents', {
      name,
      model,
      role
    })
    return data
  } catch (err) {
    console.error('addAgent', err)
    if (err instanceof AxiosError) {

      return Promise.reject(err.response?.data)
    }
    return Promise.reject(err)
  }
}

export const updateAgentModel = async ({ id, model }: { id: string, model: string }) => {
  try {
    const { data } = await axios.patch(`/api/agents/${id}/model`, {
      model
    })
    return data
  } catch (err) {
    console.error('updateAgentModel', err)
    if (err instanceof AxiosError) {

      return Promise.reject(err.response?.data)
    }
    return Promise.reject(err)
  }
}

export const updateAgent = async ({ id, payload = {} }: { id: string, payload: Partial<Agent> }) => {
  try {
    if (!id) {
      throw new Error('Id is required!')
    }
    const { data } = await axios.patch(`/api/agents/${id}`, {
      ...payload
    })
    return data
  } catch (err) {
    console.error('updateAgent', err)
    if (err instanceof AxiosError) {

      return Promise.reject(err.response?.data)
    }
    return Promise.reject(err)
  }
}

export const deleteAgent = async (id: string) => {
  try {
    const { data } = await axios.delete(`/api/agents/${id}`)
    return data
  } catch (err) {
    console.error('deleteAgent', err)
    if (err instanceof AxiosError) {
      return Promise.reject(err.response?.data)
    }
    return Promise.reject(err)
  }
}
