import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    //console.log('POST logout')
    const resp = NextResponse.json({ success: true }, { status: 200})
    resp.cookies.delete('access_token');
    return resp
  } catch (err) {
    return new NextResponse('Something went wrong.', { status: 500 })
  }
}