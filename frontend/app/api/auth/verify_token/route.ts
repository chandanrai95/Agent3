import axiosClient from "@/lib/axios";
import { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    //console.log('verify token')
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const { data } = await axiosClient.get(`/api/auth/verify_token?token=${token}`)

    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    console.error('verify_token get', err);
    if (err instanceof AxiosError) {
      return NextResponse.json(
        err.response?.data,
        { status: err.response?.status }
      )
    }

    return new NextResponse('Something went wrong.', { status: 500 })
  }
}