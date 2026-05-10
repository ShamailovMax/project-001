import { hashPassword, verifyPassword, signToken, verifyToken } from '@/lib/auth'

describe('hashPassword / verifyPassword', () => {
  it('verifies correct password', async () => {
    const hash = await hashPassword('secret123')
    expect(await verifyPassword('secret123', hash)).toBe(true)
  })

  it('rejects wrong password', async () => {
    const hash = await hashPassword('secret123')
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })
})

describe('signToken / verifyToken', () => {
  it('roundtrips a payload', async () => {
    const token = await signToken({ userId: 'u1', email: 'a@b.com' })
    const payload = await verifyToken(token)
    expect(payload?.userId).toBe('u1')
    expect(payload?.email).toBe('a@b.com')
  })

  it('returns null for invalid token', async () => {
    expect(await verifyToken('bad.token.here')).toBeNull()
  })
})
