import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const baseURL = process.env.NEXT_API_BASE_URL || 'http://localhost:4000'

// Streams any /api/agents/{id}/... call (documents, threads, messages, api_keys) to the backend,
// so uploads and SSE chat responses are passed through without buffering.
async function proxy(request: NextRequest, { params }: { params: Promise<{ id: string, path: string[] }> }) {
  const { id, path } = await params
  const token = (await cookies()).get('access_token')?.value

  const headers = new Headers()
  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)
  if (token) headers.set('authorization', `Bearer ${token}`)

  const init: RequestInit & { duplex?: 'half' } = { method: request.method, headers, signal: request.signal }
  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = request.body
    init.duplex = 'half'
  }

  try {
    const response = await fetch(`${baseURL}/api/agents/${id}/${path.join('/')}${request.nextUrl.search}`, init)
    const responseHeaders = new Headers()
    for (const name of ['content-type', 'cache-control']) {
      const value = response.headers.get(name)
      if (value) responseHeaders.set(name, value)
    }
    return new Response(response.body, { status: response.status, headers: responseHeaders })
  } catch (err) {
    console.error('agent proxy', err)
    return Response.json({ detail: 'Backend is not reachable.' }, { status: 502 })
  }
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE }
