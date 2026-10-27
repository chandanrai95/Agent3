import axios from "axios"

interface LoginInput {
  email: string,
  password: string
}

interface SignUpInput extends LoginInput {
  name: string
}

export const signUpApi = async ({
  name,
  email,
  password
}: SignUpInput) => {
  try {
    const { data } = await axios.post('/api/auth/signup', {
      name,
      email,
      password
    })
    return data
  } catch (err) {
    console.error('signUpApi', err);
    return Promise.reject(err);
  }
}

export const loginApi = async ({
  email,
  password
}: LoginInput) => {
  try {
    let { data } = await axios.post('/api/auth/login', {
      email,
      password
    })
    return data
  } catch (err) {
    console.error('loginApi', err)
    return Promise.reject(err)
  }
}

export const logoutApi = async () => {
  try {
    let { data } = await axios.post('/api/auth/logout')
    return data
  } catch (err) {
    console.error('logoutApi', err);
    return Promise.reject(err)
  }
}
