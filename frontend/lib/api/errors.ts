import { AxiosError } from "axios";

// FastAPI errors come as {detail: string | [{msg}]}, Next routes as {message}
export const errorMessage = (err: unknown, fallback = 'Something went wrong.') => {
  const data = err instanceof AxiosError ? err.response?.data : err
  if (!data || typeof data !== 'object') return fallback
  const { detail, message } = data as { detail?: unknown, message?: string }
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg).replace(/^Value error, /, '')
  return message || fallback
}
