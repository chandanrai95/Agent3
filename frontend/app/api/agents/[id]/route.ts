import axiosClient from "@/lib/axios";
import { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data } = await axiosClient.get(`/api/agents/${id}`)

    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    console.error('agents id get', err);
    if (err instanceof AxiosError) {
      return NextResponse.json(
        err.response?.data || { 'message': 'Something went wrong.' },
        {
          status: err.response?.status
        }
      )
    }

    return new NextResponse('Something went wrong.', { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const { id } = await params;

    if (!id) {
      return new NextResponse('Id is required.', { status: 400 })
    }

    const { data } = await axiosClient.patch(`/api/agents/${id}`, {
      ...(body || {})
    })


    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    console.error('agents id get', err);
    if (err instanceof AxiosError) {
      return NextResponse.json(
        err.response?.data || { 'message': 'Something went wrong.' },
        {
          status: err.response?.status
        }
      )
    }

    return new NextResponse('Something went wrong.', { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data } = await axiosClient.delete(`/api/agents/${id}`)
    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    console.error('agents id delete', err);
    if (err instanceof AxiosError) {
      return NextResponse.json(
        err.response?.data || { 'message': 'Something went wrong.' },
        {
          status: err.response?.status
        }
      )
    }

    return new NextResponse('Something went wrong.', { status: 500 })
  }
}
