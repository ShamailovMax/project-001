import { NextResponse, type NextRequest } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

const PROTECTED = ['/dashboard', '/api/documents']

export async function middleware(req: NextRequest) {
  const isProtected = PROTECTED.some(p => req.nextUrl.pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token || !(await verifyToken(token))) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/documents/:path*'],
}
