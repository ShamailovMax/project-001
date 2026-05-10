import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Clausify — Professional Document Generator',
  description: 'Generate freelance contracts and NDAs in seconds. Russian and English.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  )
}
