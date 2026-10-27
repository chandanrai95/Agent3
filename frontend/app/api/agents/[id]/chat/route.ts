import axiosClient from "@/lib/axios";
import { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }>}) {
  try {
    const body = await request.json();
    const { id } = await params;

    const { data } = await axiosClient({
      method: 'POST',
      url: `/api/agents/${id}/chat_stream`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: body,
      responseType: "stream"
    })

    if (!data) {
      return new NextResponse("No stream", { status: 500 })
    }

    const stream = new ReadableStream({
      start(controller) {
        data.on("data", (chunk: Buffer) => {
          controller.enqueue(chunk)
        })

        data.on("end", (chunk: Buffer) => {
          controller.close()
        })

        data.on("error", (err: Error) => {
          controller.error(err)
        })
      }
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    })
  } catch (err) {
    console.error('agent chat post', err)
    if (err instanceof AxiosError) {
      return NextResponse.json(
        err.response?.data || { message: 'Something went wrong.' },
        { status: err.response?.status }
      )
    }

    return new NextResponse('Something went wrong.', { status: 500 })
  }
}