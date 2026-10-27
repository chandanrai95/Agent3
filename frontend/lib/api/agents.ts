import axios, { AxiosError } from "axios";

export const getUserAgents = async () => {
  try {
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents`)

    return data
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

export const uploadAgentDocument = async ({ id, file }: { id: string | null, file: File }) => {
  try {

    const formData = new FormData()
    formData.append("file", file)

    const { data } = await axios({
      url: `/api/agents/${id}/upload`,
      method: 'POST',
      data: formData
    })
    return data
  } catch (err) {
    console.error('uploadAgentDocument', err)
    if (err instanceof AxiosError) {

      return Promise.reject(err.response?.data)
    }
    return Promise.reject(err)
  }
}


export const agentChat = async ({ id, message }: { id: string, message: string }) => {
  try {

     const response = await fetch(`/api/agents/${id}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    })

    if (!response.body) return

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    return decoder
  } catch (err) {
    console.error('uploadAgentDocument', err)
    if (err instanceof AxiosError) {

      return Promise.reject(err.response?.data)
    }
    return Promise.reject(err)
  }
}

export const updateAgent = async ({ id, payload = {} }: { id: string, payload: any }) => {
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