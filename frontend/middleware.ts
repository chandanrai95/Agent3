import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ['/auth', '/api/auth']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  //console.log('pathname', pathname)

  if (PUBLIC_ROUTES.some(el => pathname.startsWith(el))) {
    return NextResponse.next()
  }
  let access_token = req.cookies.get('access_token')?.value
  //console.log('access_token', access_token)
  if (!access_token) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return NextResponse.next();
}


export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}