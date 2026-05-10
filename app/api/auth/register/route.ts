import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { readUsers, writeUsers, type User } from '@/lib/storage'
import { hashPassword, signToken, COOKIE_NAME, TTL_SECONDS } from '@/lib/auth'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: 'Email and password (min 6 chars) required' }, { status: 400 })
  }

  const users = readUsers()
  if (users.find(u => u.email === email)) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const user: User = {
    id: randomUUID(),
    email,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
    plan: 'free',
  }
  writeUsers([...users, user])

  const token = await signToken({ userId: user.id, email: user.email })
  const res = NextResponse.json({ ok: true }, { status: 201 })
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: TTL_SECONDS, path: '/' })
  return res
}
