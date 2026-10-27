import axiosClient from "@/lib/axios";
import { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return new NextResponse('Id is required!', { status: 400 })
    }

    const { data } = await axiosClient.get(`/api/sources/by_agent/${id}`)

    return NextResponse.json(
      data,
      { status: 200 }
    )
  } catch (err) {
    console.error('agent sources by id', err)
    if (err instanceof AxiosError) {
      return NextResponse.json(
        err.response?.data || { message: 'Something went wrong.' },
        { status: err.response?.status }
      )
    }

    return new NextResponse('Something went wrong.', { status: 500 })
  }
}