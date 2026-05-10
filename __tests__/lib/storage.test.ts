import fs from 'fs'
import path from 'path'
import {
  readUsers, writeUsers,
  readGuestLimits, writeGuestLimits,
  readHistory, writeHistory,
  type User, type GuestLimits, type HistoryEntry
} from '@/lib/storage'

const TMP = path.join(process.cwd(), '__tests__/tmp')

beforeEach(() => fs.mkdirSync(TMP, { recursive: true }))
afterEach(() => fs.rmSync(TMP, { recursive: true, force: true }))

describe('readUsers / writeUsers', () => {
  it('returns empty array when file is empty', () => {
    const file = path.join(TMP, 'users.json')
    fs.writeFileSync(file, '[]')
    expect(readUsers(file)).toEqual([])
  })

  it('roundtrips a user', () => {
    const file = path.join(TMP, 'users.json')
    fs.writeFileSync(file, '[]')
    const user: User = { id: '1', email: 'a@b.com', passwordHash: 'x', createdAt: '2026-01-01', plan: 'free' }
    writeUsers([user], file)
    expect(readUsers(file)).toEqual([user])
  })
})

describe('readGuestLimits / writeGuestLimits', () => {
  it('roundtrips limits', () => {
    const file = path.join(TMP, 'limits.json')
    fs.writeFileSync(file, '{}')
    const limits: GuestLimits = { '1.2.3.4': { count: 2, date: '2026-05-10' } }
    writeGuestLimits(limits, file)
    expect(readGuestLimits(file)).toEqual(limits)
  })
})

describe('readHistory / writeHistory', () => {
  it('returns empty array for new user dir', () => {
    const dir = path.join(TMP, 'users', 'u1')
    expect(readHistory(dir)).toEqual([])
  })

  it('roundtrips history entries', () => {
    const dir = path.join(TMP, 'users', 'u1')
    const entry: HistoryEntry = { id: 'h1', type: 'contract', lang: 'ru', createdAt: '2026-05-10', fields: {} }
    writeHistory([entry], dir)
    expect(readHistory(dir)).toEqual([entry])
  })
})
