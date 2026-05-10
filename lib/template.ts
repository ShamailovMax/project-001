import fs from 'fs'
import path from 'path'
import yaml from 'yaml'

export type FieldDef = {
  key: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'number'
  required: boolean
  placeholder?: string
}

export type Section = {
  id: string
  title: string
  content: string
}

export type Template = {
  title: string
  sections: Section[]
  fields: FieldDef[]
}

const TEMPLATES_DIR = path.join(process.cwd(), 'data/templates')

export function loadTemplate(type: 'contract' | 'nda', lang: 'ru' | 'en'): Template {
  const file = path.join(TEMPLATES_DIR, `${type}.${lang}.yaml`)
  if (!fs.existsSync(file)) throw new Error(`Template not found: ${type}.${lang}`)
  const raw = fs.readFileSync(file, 'utf-8')
  return yaml.parse(raw) as Template
}
