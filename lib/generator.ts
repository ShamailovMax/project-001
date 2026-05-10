import type { Template, Section } from '@/lib/template'

export type FilledTemplate = {
  title: string
  sections: Section[]
}

export function fillTemplate(template: Template, values: Record<string, string>): FilledTemplate {
  for (const field of template.fields) {
    if (field.required && !values[field.key]) {
      throw new Error(`Missing required field: ${field.key}`)
    }
  }

  function replace(text: string): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? `{{${key}}}`)
  }

  return {
    title: replace(template.title),
    sections: template.sections.map(s => ({ ...s, content: replace(s.content) })),
  }
}
