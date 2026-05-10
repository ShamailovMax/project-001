import path from 'path'
import fs from 'fs'
import { jest, beforeEach, afterEach, describe, it, expect } from '@jest/globals'
import * as actualStorage from '@/lib/storage'

const TMP_LIMITS = path.join(process.cwd(), '__tests__/tmp/limits.json')

const mockRenderToBuffer = jest.fn().mockResolvedValue(Buffer.from('fake-pdf'))

await jest.unstable_mockModule('@react-pdf/renderer', () => ({
  renderToBuffer: mockRenderToBuffer,
  Document: 'Document',
  Page: 'Page',
  Text: 'Text',
  View: 'View',
  StyleSheet: { create: (s: any) => s },
}))

await jest.unstable_mockModule('@/lib/pdf', () => ({
  ClausifyDocument: 'ClausifyDocument',
}))

await jest.unstable_mockModule('@/lib/storage', () => ({
  ...actualStorage,
  readGuestLimits: () => actualStorage.readGuestLimits(TMP_LIMITS),
  writeGuestLimits: (limits: actualStorage.GuestLimits) =>
    actualStorage.writeGuestLimits(limits, TMP_LIMITS),
}))

// Dynamic imports AFTER mocks
const { POST } = await import('@/app/api/generate/route')

beforeEach(() => {
  fs.mkdirSync(path.dirname(TMP_LIMITS), { recursive: true })
  fs.writeFileSync(TMP_LIMITS, '{}')
  jest.clearAllMocks()
  mockRenderToBuffer.mockResolvedValue(Buffer.from('fake-pdf'))
})
afterEach(() => fs.rmSync(path.dirname(TMP_LIMITS), { recursive: true, force: true }))

function req(body: object, ip = '1.2.3.4') {
  return new Request('http://localhost/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

const contractFields = {
  freelancerName: 'Alice', clientName: 'Acme', projectDescription: 'Website',
  startDate: '2026-01-01', endDate: '2026-02-01', amount: '1000', paymentTerms: '50/50',
}

describe('POST /api/generate', () => {
  it('returns PDF for valid contract request', async () => {
    const res = await POST(req({ type: 'contract', lang: 'ru', fields: contractFields }))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/pdf')
  })

  it('returns 400 for missing required field', async () => {
    const res = await POST(req({ type: 'contract', lang: 'ru', fields: { freelancerName: 'Alice' } }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for unknown document type', async () => {
    const res = await POST(req({ type: 'invoice', lang: 'ru', fields: {} }))
    expect(res.status).toBe(400)
  })
})
