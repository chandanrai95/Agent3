import axiosClient from "@/lib/axios";
import { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const {
      id
    } = await params;

    const {
      model
    } = await request.json()

    const { data } = await axiosClient.patch(`/api/agents/${id}/model`, {
      model
    })

    return NextResponse.json(data, { status: 200 })

  } catch (err) {
    console.error('agent model patch', err)
    if (err instanceof AxiosError) {
      return NextResponse.json(
        err.response?.data || { message: 'Something went wrong.' },
        { status: err.response?.status }
      )
    }

    return new NextResponse('Something went wrong.', { status: 500 })
  }
}