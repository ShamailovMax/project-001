import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { loadTemplate } from '@/lib/template'
import { fillTemplate } from '@/lib/generator'
import { ClausifyDocument } from '@/lib/pdf'
import { readGuestLimits, writeGuestLimits } from '@/lib/storage'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { createElement } from 'react'

const GUEST_LIMIT = 3

function getIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

function checkGuestLimit(ip: string): boolean {
  const today = new Date().toISOString().slice(0, 10)
  const limits = readGuestLimits()
  const entry = limits[ip]
  if (!entry || entry.date !== today) {
    limits[ip] = { count: 1, date: today }
    writeGuestLimits(limits)
    return true
  }
  if (entry.count >= GUEST_LIMIT) return false
  limits[ip] = { count: entry.count + 1, date: today }
  writeGuestLimits(limits)
  return true
}

export async function POST(req: Request) {
  const body = await req.json()
  const { type, lang, fields } = body as { type: string; lang: string; fields: Record<string, string>; guest?: boolean }

  if (!['contract', 'nda'].includes(type)) {
    return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
  }
  if (!['ru', 'en'].includes(lang)) {
    return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
  }

  const token = req.headers.get('cookie')?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1]
  const session = token ? await verifyToken(token) : null
  const isGuest = !session

  if (isGuest) {
    const ip = getIp(req)
    if (!checkGuestLimit(ip)) {
      return NextResponse.json({ error: 'Guest limit reached. Please register.' }, { status: 429 })
    }
  }

  let template, filled
  try {
    template = loadTemplate(type as 'contract' | 'nda', lang as 'ru' | 'en')
    filled = fillTemplate(template, fields)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  const element = createElement(ClausifyDocument, { doc: filled, watermark: isGuest })
  const buffer = await renderToBuffer(element as any)

  const filename = `${type}-${lang}-${Date.now()}.pdf`
  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
