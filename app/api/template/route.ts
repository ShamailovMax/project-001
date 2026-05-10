import { NextResponse, type NextRequest } from 'next/server'
import { loadTemplate } from '@/lib/template'

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type')
  const lang = req.nextUrl.searchParams.get('lang')
  if (!['contract', 'nda'].includes(type ?? '')) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
  if (!['ru', 'en'].includes(lang ?? '')) {
    return NextResponse.json({ error: 'Invalid lang' }, { status: 400 })
  }
  try {
    const template = loadTemplate(type as 'contract' | 'nda', lang as 'ru' | 'en')
    return NextResponse.json({ fields: template.fields, title: template.title })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 404 })
  }
}
