import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/proxy";

async function proxy(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params
  return proxyToBackend(request, `/api/settings${path?.length ? `/${path.join('/')}` : ''}`)
}

export { proxy as GET, proxy as PUT, proxy as DELETE }
