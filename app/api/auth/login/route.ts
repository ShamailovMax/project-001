import { NextResponse } from 'next/server'
import { readUsers } from '@/lib/storage'
import { verifyPassword, signToken, COOKIE_NAME, TTL_SECONDS } from '@/lib/auth'

export async function POST(req: Request) {
  const { email, password } = await req.json()
  const user = readUsers().find(u => u.email === email)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  const token = await signToken({ userId: user.id, email: user.email })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: TTL_SECONDS, path: '/' })
  return res
}
