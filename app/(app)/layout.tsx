'use client'
import Link from 'next/link'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-4 border-b">
        <Link href="/" className="font-bold text-xl">Clausify</Link>
        <div className="flex gap-4">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              window.location.href = '/'
            }}
            className="text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  )
}
