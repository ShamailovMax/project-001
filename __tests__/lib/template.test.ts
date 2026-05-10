import { loadTemplate } from '@/lib/template'

describe('loadTemplate', () => {
  it('loads contract.ru template', () => {
    const tpl = loadTemplate('contract', 'ru')
    expect(tpl.title).toBeTruthy()
    expect(tpl.sections.length).toBeGreaterThan(0)
    expect(tpl.fields.length).toBeGreaterThan(0)
  })

  it('loads nda.en template', () => {
    const tpl = loadTemplate('nda', 'en')
    expect(tpl.title).toBeTruthy()
    expect(tpl.fields.some(f => f.key === 'disclosingParty')).toBe(true)
  })

  it('throws on unknown type', () => {
    expect(() => loadTemplate('invoice' as any, 'ru')).toThrow()
  })
})
