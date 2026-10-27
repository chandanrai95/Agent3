import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const baseURL = process.env.NEXT_API_BASE_URL || 'http://localhost:4000'

// Forwards a request to the backend with the user's token. File uploads and SSE responses are streamed.
export async function proxyToBackend(request: NextRequest, path: string) {
  const token = (await cookies()).get('access_token')?.value

  const headers = new Headers()
  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)
  if (token) headers.set('authorization', `Bearer ${token}`)

  const init: RequestInit & { duplex?: 'half' } = { method: request.method, headers, signal: request.signal }
  if (!['GET', 'HEAD'].includes(request.method)) {
    if (contentType?.startsWith('multipart/form-data')) {
      // stream file uploads instead of holding them in memory
      init.body = request.body
      init.duplex = 'half'
    } else {
      init.body = await request.text()
    }
  }

  try {
    const response = await fetch(`${baseURL}${path}${request.nextUrl.search}`, init)
    const responseHeaders = new Headers()
    for (const name of ['content-type', 'cache-control']) {
      const value = response.headers.get(name)
      if (value) responseHeaders.set(name, value)
    }
    return new Response(response.body, { status: response.status, headers: responseHeaders })
  } catch (err) {
    console.error('backend proxy', err)
    return Response.json({ detail: 'Backend is not reachable.' }, { status: 502 })
  }
}
