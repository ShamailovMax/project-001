import fs from 'fs'
import path from 'path'
import { jest, beforeEach, afterEach, describe, it, expect } from '@jest/globals'
import * as actualStorage from '@/lib/storage'

const TMP_USERS = path.join(process.cwd(), '__tests__/tmp/users2.json')

jest.unstable_mockModule('@/lib/storage', () => ({
  ...actualStorage,
  readUsers: (f?: string) => actualStorage.readUsers(f ?? TMP_USERS),
  writeUsers: (u: actualStorage.User[], f?: string) =>
    actualStorage.writeUsers(u, f ?? TMP_USERS),
}))

beforeEach(() => {
  fs.mkdirSync(path.dirname(TMP_USERS), { recursive: true })
  fs.writeFileSync(TMP_USERS, '[]')
})
afterEach(() => fs.rmSync(path.dirname(TMP_USERS), { recursive: true, force: true }))

function req(body: object) {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    const { POST: register } = await import('@/app/api/auth/register/route')
    await register(req({ email: 'user@test.com', password: 'correct123' }))
  })

  it('returns 200 and sets cookie on correct credentials', async () => {
    const { POST: login } = await import('@/app/api/auth/login/route')
    const res = await login(req({ email: 'user@test.com', password: 'correct123' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('set-cookie')).toContain('clausify_session')
  })

  it('returns 401 on wrong password', async () => {
    const { POST: login } = await import('@/app/api/auth/login/route')
    const res = await login(req({ email: 'user@test.com', password: 'wrong' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 on unknown email', async () => {
    const { POST: login } = await import('@/app/api/auth/login/route')
    const res = await login(req({ email: 'ghost@test.com', password: 'any' }))
    expect(res.status).toBe(401)
  })
})
