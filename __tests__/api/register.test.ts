import fs from 'fs'
import path from 'path'
import { jest, beforeEach, afterEach, describe, it, expect } from '@jest/globals'
import * as actualStorage from '@/lib/storage'

const TMP_USERS = path.join(process.cwd(), '__tests__/tmp/users.json')

jest.unstable_mockModule('@/lib/storage', () => ({
  ...actualStorage,
  readUsers: (file?: string) => actualStorage.readUsers(file ?? TMP_USERS),
  writeUsers: (users: actualStorage.User[], file?: string) =>
    actualStorage.writeUsers(users, file ?? TMP_USERS),
}))

beforeEach(() => {
  fs.mkdirSync(path.dirname(TMP_USERS), { recursive: true })
  fs.writeFileSync(TMP_USERS, '[]')
})
afterEach(() => fs.rmSync(path.dirname(TMP_USERS), { recursive: true, force: true }))

function makeRequest(body: object) {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const { readUsers } = await import('@/lib/storage')
    const res = await POST(makeRequest({ email: 'new@test.com', password: 'pass1234' }))
    expect(res.status).toBe(201)
    const users = readUsers(TMP_USERS)
    expect(users).toHaveLength(1)
    expect(users[0].email).toBe('new@test.com')
  })

  it('rejects duplicate email with 409', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    await POST(makeRequest({ email: 'dup@test.com', password: 'pass1234' }))
    const res = await POST(makeRequest({ email: 'dup@test.com', password: 'pass1234' }))
    expect(res.status).toBe(409)
  })

  it('rejects short password with 400', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const res = await POST(makeRequest({ email: 'x@test.com', password: '123' }))
    expect(res.status).toBe(400)
  })
})
