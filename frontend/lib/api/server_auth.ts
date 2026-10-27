import axios from "axios"
import { cookies } from "next/headers"

export const verifyTokenApi = async () => {
  try {
    let cookiesStore = await cookies();
    let token = cookiesStore.get('access_token')?.value

    //console.log('-----', `${process.env.NEXT_API_BASE_URL}/api/auth/verify_token?token=${token}`)
    let { data } = await axios.get(`${process.env.NEXT_API_BASE_URL}/api/auth/verify_token?token=${token}`)
    return data
  } catch (err) {
    console.error('verifyTokenApi', err);
    return Promise.reject(err)
  }
}