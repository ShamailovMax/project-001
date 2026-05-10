import { NextResponse, type NextRequest } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifyToken(token) : null
  if (!session) return NextResponse.json({ user: null })
  return NextResponse.json({ user: { email: session.email } })
}
