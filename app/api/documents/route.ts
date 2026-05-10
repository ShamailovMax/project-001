import { NextResponse, type NextRequest } from 'next/server'
import path from 'path'
import { readHistory } from '@/lib/storage'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

const USERS_DIR = path.join(process.cwd(), 'data/users')

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifyToken(token) : null
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userDir = path.join(USERS_DIR, session.userId)
  const history = readHistory(userDir)
  return NextResponse.json(history)
}
