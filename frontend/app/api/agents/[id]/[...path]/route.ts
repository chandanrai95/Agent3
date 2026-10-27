import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/proxy";

// documents, threads, messages (SSE) and api_keys of one agent
async function proxy(request: NextRequest, { params }: { params: Promise<{ id: string, path: string[] }> }) {
  const { id, path } = await params
  return proxyToBackend(request, `/api/agents/${id}/${path.join('/')}`)
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE }
