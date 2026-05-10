import { fillTemplate } from '@/lib/generator'
import type { Template } from '@/lib/template'

const mockTemplate: Template = {
  title: 'Test Doc',
  sections: [
    { id: 's1', title: '1. Parties', content: '{{partyA}} and {{partyB}}' },
    { id: 's2', title: '2. Amount', content: 'Pay {{amount}} by {{date}}' },
  ],
  fields: [
    { key: 'partyA', label: 'Party A', type: 'text', required: true },
    { key: 'partyB', label: 'Party B', type: 'text', required: true },
    { key: 'amount', label: 'Amount', type: 'number', required: true },
    { key: 'date', label: 'Date', type: 'date', required: true },
  ],
}

describe('fillTemplate', () => {
  it('replaces all placeholders', () => {
    const filled = fillTemplate(mockTemplate, { partyA: 'Alice', partyB: 'Bob', amount: '100', date: '2026-01-01' })
    expect(filled.sections[0].content).toBe('Alice and Bob')
    expect(filled.sections[1].content).toBe('Pay 100 by 2026-01-01')
  })

  it('leaves unknown placeholders intact', () => {
    const filled = fillTemplate(mockTemplate, { partyA: 'Alice', partyB: 'Bob', amount: '100', date: '2026-01-01' })
    expect(filled.title).toBe('Test Doc')
  })

  it('throws if required field is missing', () => {
    expect(() => fillTemplate(mockTemplate, { partyA: 'Alice' })).toThrow('Missing required field: partyB')
  })
})
