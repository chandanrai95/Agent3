import axiosClient from "@/lib/axios";
import axios, { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password
    } = body


    const { data } = await axiosClient.post('/api/auth/login', {
      email,
      password
    })

    let resp = NextResponse.json(data, { status: 200 })

    resp.cookies.set('access_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV == 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    })

    return resp
  } catch (err) {
    console.error('login post', err)
    if (err instanceof AxiosError) {
      return NextResponse.json(err?.response?.data || { message: 'Something went wrong' }, { status: err.response?.status })
    }

    return new NextResponse('Something went wrong.', { status: 500 })
  }
}