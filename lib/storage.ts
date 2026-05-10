import fs from 'fs'
import path from 'path'

export type User = {
  id: string
  email: string
  passwordHash: string
  createdAt: string
  plan: 'free' | 'pro' | 'agency'
}

export type GuestLimits = Record<string, { count: number; date: string }>

export type HistoryEntry = {
  id: string
  type: 'contract' | 'nda'
  lang: 'ru' | 'en'
  createdAt: string
  fields: Record<string, string>
}

const USERS_FILE = path.join(process.cwd(), 'data/users.json')
const LIMITS_FILE = path.join(process.cwd(), 'data/guest-limits.json')
const USERS_DIR = path.join(process.cwd(), 'data/users')

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T
  } catch {
    return fallback
  }
}

function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

export function readUsers(file = USERS_FILE): User[] {
  return readJson<User[]>(file, [])
}

export function writeUsers(users: User[], file = USERS_FILE): void {
  writeJson(file, users)
}

export function readGuestLimits(file = LIMITS_FILE): GuestLimits {
  return readJson<GuestLimits>(file, {})
}

export function writeGuestLimits(limits: GuestLimits, file = LIMITS_FILE): void {
  writeJson(file, limits)
}

export function readHistory(dir = USERS_DIR): HistoryEntry[] {
  const file = path.join(dir, 'history.json')
  return readJson<HistoryEntry[]>(file, [])
}

export function writeHistory(entries: HistoryEntry[], dir = USERS_DIR): void {
  const file = path.join(dir, 'history.json')
  writeJson(file, entries)
}
