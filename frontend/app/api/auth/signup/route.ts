import axiosClient from "@/lib/axios";
import { AxiosError } from "axios";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      password
    } = body

    const { data } = await axiosClient.post('/api/auth/signup', {
      name,
      email,
      password
    })

    const resp =  NextResponse.json(data, { status: 201 })

    resp.cookies.set('access_token', data?.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV == 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })

    return resp
  } catch (err) {
    console.error('sign up post', err);
    if (err instanceof AxiosError) {
      return NextResponse.json(err?.response?.data || { message: 'Something went wrong.' }, { status: 500 })
    }
    return new NextResponse('Something went wrong.', { status: 500 })
  }
}