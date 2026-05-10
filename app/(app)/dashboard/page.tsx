import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import path from 'path'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { readHistory } from '@/lib/storage'

const USERS_DIR = path.join(process.cwd(), 'data/users')

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const session = token ? await verifyToken(token) : null
  if (!session) redirect('/login')

  const userDir = path.join(USERS_DIR, session.userId)
  const history = readHistory(userDir)

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/generate/contract" className="border px-4 py-2 rounded-lg hover:bg-gray-50">New Contract</Link>
          <Link href="/generate/nda" className="border px-4 py-2 rounded-lg hover:bg-gray-50">New NDA</Link>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-xl mb-4">No documents yet</p>
          <Link href="/generate/contract" className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800">
            Create your first document
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {history.slice().reverse().map(entry => (
            <div key={entry.id} className="flex items-center justify-between p-4 border rounded-xl">
              <div>
                <p className="font-medium capitalize">{entry.type} — {entry.lang.toUpperCase()}</p>
                <p className="text-sm text-gray-400">{new Date(entry.createdAt).toLocaleDateString()}</p>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">saved</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
