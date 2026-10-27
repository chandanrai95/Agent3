import axiosClient from "@/lib/axios";
import { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { data } = await axiosClient.get('/api/agents/by_user');

    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    console.error('get agent error', err);
    if (err instanceof AxiosError) {
      return NextResponse.json(
        err.response?.data || 'Something went wrong.',
        { status: err.response?.status }
      )
    }
    return new NextResponse('Something went wrong.', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      model,
      role
    } = await request.json();

    if (!name) {
      return NextResponse.json({ message: 'Name is required.' }, { status: 400 })
    }

    if (!model) {
      return NextResponse.json({ message: 'Model is required.' }, { status: 400 })
    }

    if (!role) {
      return NextResponse.json({ message: 'Role is required.' }, { status: 400 })
    }

    const { data } = await axiosClient.post(`/api/agents/create`, {
      name,
      model,
      role
    })

    return NextResponse.json(
      data,
      { status: 200 }
    )
  } catch (err) {
    console.error('posr agent error', err);
    if (err instanceof AxiosError) {
      return NextResponse.json(
        err.response?.data || 'Something went wrong.',
        { status: err.response?.status }
      )
    }
    return new NextResponse('Something went wrong.', { status: 500 })
  }
}