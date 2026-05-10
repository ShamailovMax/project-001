import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-4 border-b">
        <span className="font-bold text-xl">Clausify</span>
        <div className="flex gap-4">
          <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign in</Link>
          <Link href="/register" className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">Get started</Link>
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center flex-1 px-8 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Professional documents<br />in seconds
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-xl">
          Generate freelance contracts and NDAs in Russian or English.
          Fill in the form — download a ready-to-sign PDF.
        </p>
        <div className="flex gap-4">
          <Link href="/generate/contract" className="bg-black text-white px-6 py-3 rounded-lg text-lg hover:bg-gray-800">
            Create Contract
          </Link>
          <Link href="/generate/nda" className="border border-gray-300 px-6 py-3 rounded-lg text-lg hover:border-gray-500">
            Create NDA
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-8 px-16 py-16 bg-gray-50 border-t">
        {[
          { title: 'Freelance Contract', desc: 'Scope, payment terms, deadlines — all covered.' },
          { title: 'NDA', desc: 'Protect your confidential info before negotiations.' },
          { title: 'RU + EN', desc: 'Instant language switch. Same form, two languages.' },
        ].map(f => (
          <div key={f.title} className="p-6 bg-white rounded-xl border">
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-gray-500">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="text-center py-6 text-gray-400 text-sm border-t">
        © 2026 Clausify
      </footer>
    </main>
  )
}
