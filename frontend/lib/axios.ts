import axios from "axios";
import { cookies } from "next/headers";

let baseURL = process.env.NEXT_API_BASE_URL || 'http://localhost:4000'

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

axiosClient.interceptors.request.use(async (config) => {
  const cookiesStore = await cookies()
  let access_token = cookiesStore.get('access_token')?.value;
  // //console.log('interceptors access_token--', access_token)

  if (access_token) {
    config.headers.Authorization = `Bearer ${access_token}`;
  }

  return config;
})


export default axiosClient;