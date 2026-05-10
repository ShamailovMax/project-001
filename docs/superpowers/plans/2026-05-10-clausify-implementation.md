# Clausify Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Построить SaaS-генератор юридических документов (контракт фрилансера + NDA) с аккаунтами, гостевым режимом и PDF-экспортом.

**Architecture:** File-based хранилище (users.json, history.json, guest-limits.json). Шаблоны документов в YAML. JWT в httpOnly-куке. PDF через @react-pdf/renderer на сервере.

**Tech Stack:** Next.js 15 (App Router), TypeScript, @react-pdf/renderer, bcryptjs, jose, yaml, Jest, @testing-library/react, Tailwind CSS

---

## File Map

```
app/
  page.tsx                          # Лендинг
  layout.tsx                        # Root layout
  middleware.ts                     # Защита /dashboard
  (auth)/
    login/page.tsx
    register/page.tsx
  (app)/
    dashboard/page.tsx
    generate/[type]/page.tsx
  api/
    auth/
      register/route.ts
      login/route.ts
      logout/route.ts
    generate/route.ts
    documents/route.ts

lib/
  storage.ts       # Чтение/запись JSON-файлов
  auth.ts          # JWT + bcrypt helpers
  template.ts      # Парсинг YAML-шаблонов
  generator.ts     # Замена {{placeholders}}
  pdf.tsx          # React-PDF компонент

data/
  users.json
  guest-limits.json
  templates/
    contract.ru.yaml
    contract.en.yaml
    nda.ru.yaml
    nda.en.yaml
  users/           # Создаётся динамически

__tests__/
  lib/storage.test.ts
  lib/auth.test.ts
  lib/template.test.ts
  lib/generator.test.ts
  api/register.test.ts
  api/login.test.ts
  api/generate.test.ts
```

---

### Task 1: Project Setup

**Files:**
- Modify: `package.json`
- Create: `tsconfig.json`, `tailwind.config.ts`, `jest.config.ts`, `jest.setup.ts`, `.env.local`

- [ ] **Step 1: Инициализировать Next.js проект**

```bash
cd C:/Users/Максим/desktop/projects/project-001
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

- [ ] **Step 2: Установить зависимости**

```bash
npm install @react-pdf/renderer bcryptjs jose yaml
npm install -D jest jest-environment-node @types/jest @types/bcryptjs ts-jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

- [ ] **Step 3: Настроить Jest**

Создать `jest.config.ts`:
```typescript
import type { Config } from 'jest'

const config: Config = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/lib/**/*.test.ts', '**/__tests__/api/**/*.test.ts'],
      transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs' } }] },
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/components/**/*.test.tsx'],
      transform: { '^.+\\.tsx?$': ['ts-jest', {}] },
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
      setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
    },
  ],
}
export default config
```

Создать `jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Создать `.env.local`**

```
JWT_SECRET=change-me-to-a-random-32-char-string-in-prod
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: project setup — Next.js 15, deps, jest config"
```

---

### Task 2: Data Layer (storage.ts)

**Files:**
- Create: `lib/storage.ts`
- Create: `data/users.json`, `data/guest-limits.json`
- Create: `__tests__/lib/storage.test.ts`

- [ ] **Step 1: Создать пустые data-файлы**

`data/users.json`:
```json
[]
```

`data/guest-limits.json`:
```json
{}
```

- [ ] **Step 2: Написать failing тесты**

`__tests__/lib/storage.test.ts`:
```typescript
import fs from 'fs'
import path from 'path'
import {
  readUsers, writeUsers,
  readGuestLimits, writeGuestLimits,
  readHistory, writeHistory,
  type User, type GuestLimits, type HistoryEntry
} from '@/lib/storage'

const TMP = path.join(process.cwd(), '__tests__/tmp')

beforeEach(() => fs.mkdirSync(TMP, { recursive: true }))
afterEach(() => fs.rmSync(TMP, { recursive: true, force: true }))

describe('readUsers / writeUsers', () => {
  it('returns empty array when file is empty', () => {
    const file = path.join(TMP, 'users.json')
    fs.writeFileSync(file, '[]')
    expect(readUsers(file)).toEqual([])
  })

  it('roundtrips a user', () => {
    const file = path.join(TMP, 'users.json')
    fs.writeFileSync(file, '[]')
    const user: User = { id: '1', email: 'a@b.com', passwordHash: 'x', createdAt: '2026-01-01', plan: 'free' }
    writeUsers([user], file)
    expect(readUsers(file)).toEqual([user])
  })
})

describe('readGuestLimits / writeGuestLimits', () => {
  it('roundtrips limits', () => {
    const file = path.join(TMP, 'limits.json')
    fs.writeFileSync(file, '{}')
    const limits: GuestLimits = { '1.2.3.4': { count: 2, date: '2026-05-10' } }
    writeGuestLimits(limits, file)
    expect(readGuestLimits(file)).toEqual(limits)
  })
})

describe('readHistory / writeHistory', () => {
  it('returns empty array for new user dir', () => {
    const dir = path.join(TMP, 'users', 'u1')
    expect(readHistory(dir)).toEqual([])
  })

  it('roundtrips history entries', () => {
    const dir = path.join(TMP, 'users', 'u1')
    const entry: HistoryEntry = { id: 'h1', type: 'contract', lang: 'ru', createdAt: '2026-05-10', fields: {} }
    writeHistory([entry], dir)
    expect(readHistory(dir)).toEqual([entry])
  })
})
```

- [ ] **Step 3: Запустить — убедиться что FAIL**

```bash
npx jest storage --no-coverage
```
Ожидаем: Cannot find module '@/lib/storage'

- [ ] **Step 4: Реализовать `lib/storage.ts`**

```typescript
import fs from 'fs'
import path from 'path'

export type User = {
  id: string
  email: string
  passwordHash: string
  createdAt: string
  plan: 'free' | 'pro' | 'agency'
}

export type GuestLimits = Record<string, { count: number; date: string }>

export type HistoryEntry = {
  id: string
  type: 'contract' | 'nda'
  lang: 'ru' | 'en'
  createdAt: string
  fields: Record<string, string>
}

const USERS_FILE = path.join(process.cwd(), 'data/users.json')
const LIMITS_FILE = path.join(process.cwd(), 'data/guest-limits.json')
const USERS_DIR = path.join(process.cwd(), 'data/users')

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T
  } catch {
    return fallback
  }
}

function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

export function readUsers(file = USERS_FILE): User[] {
  return readJson<User[]>(file, [])
}

export function writeUsers(users: User[], file = USERS_FILE): void {
  writeJson(file, users)
}

export function readGuestLimits(file = LIMITS_FILE): GuestLimits {
  return readJson<GuestLimits>(file, {})
}

export function writeGuestLimits(limits: GuestLimits, file = LIMITS_FILE): void {
  writeJson(file, limits)
}

export function readHistory(dir = USERS_DIR): HistoryEntry[] {
  const file = path.join(dir, 'history.json')
  return readJson<HistoryEntry[]>(file, [])
}

export function writeHistory(entries: HistoryEntry[], dir = USERS_DIR): void {
  const file = path.join(dir, 'history.json')
  writeJson(file, entries)
}
```

- [ ] **Step 5: Запустить — убедиться что PASS**

```bash
npx jest storage --no-coverage
```
Ожидаем: PASS (6 тестов)

- [ ] **Step 6: Commit**

```bash
git add data/users.json data/guest-limits.json lib/storage.ts __tests__/lib/storage.test.ts
git commit -m "feat: file-based storage layer"
```

---

### Task 3: Auth Utilities (auth.ts)

**Files:**
- Create: `lib/auth.ts`
- Create: `__tests__/lib/auth.test.ts`

- [ ] **Step 1: Написать failing тесты**

`__tests__/lib/auth.test.ts`:
```typescript
import { hashPassword, verifyPassword, signToken, verifyToken } from '@/lib/auth'

describe('hashPassword / verifyPassword', () => {
  it('verifies correct password', async () => {
    const hash = await hashPassword('secret123')
    expect(await verifyPassword('secret123', hash)).toBe(true)
  })

  it('rejects wrong password', async () => {
    const hash = await hashPassword('secret123')
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })
})

describe('signToken / verifyToken', () => {
  it('roundtrips a payload', async () => {
    const token = await signToken({ userId: 'u1', email: 'a@b.com' })
    const payload = await verifyToken(token)
    expect(payload?.userId).toBe('u1')
    expect(payload?.email).toBe('a@b.com')
  })

  it('returns null for invalid token', async () => {
    expect(await verifyToken('bad.token.here')).toBeNull()
  })
})
```

- [ ] **Step 2: Запустить — убедиться что FAIL**

```bash
npx jest auth --no-coverage
```

- [ ] **Step 3: Реализовать `lib/auth.ts`**

```typescript
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-me')
const COOKIE_NAME = 'clausify_session'
const TTL_SECONDS = 7 * 24 * 60 * 60

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export type TokenPayload = { userId: string; email: string }

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

export { COOKIE_NAME, TTL_SECONDS }
```

- [ ] **Step 4: Запустить — убедиться что PASS**

```bash
npx jest auth --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts __tests__/lib/auth.test.ts
git commit -m "feat: auth utilities — bcrypt + JWT"
```

---

### Task 4: Template System (template.ts + YAML файлы)

**Files:**
- Create: `lib/template.ts`
- Create: `data/templates/contract.ru.yaml`
- Create: `data/templates/contract.en.yaml`
- Create: `data/templates/nda.ru.yaml`
- Create: `data/templates/nda.en.yaml`
- Create: `__tests__/lib/template.test.ts`

- [ ] **Step 1: Написать failing тесты**

`__tests__/lib/template.test.ts`:
```typescript
import path from 'path'
import { loadTemplate, type Template } from '@/lib/template'

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
```

- [ ] **Step 2: Запустить — убедиться что FAIL**

```bash
npx jest template --no-coverage
```

- [ ] **Step 3: Создать YAML шаблоны**

`data/templates/contract.ru.yaml`:
```yaml
title: "Договор на оказание услуг"
sections:
  - id: parties
    title: "1. Стороны"
    content: |
      Исполнитель: {{freelancerName}}, именуемый далее «Исполнитель»,
      и {{clientName}}, именуемый далее «Заказчик»,
      заключили настоящий договор о нижеследующем.
  - id: scope
    title: "2. Предмет договора"
    content: |
      Исполнитель обязуется выполнить: {{projectDescription}}.
      Срок выполнения: с {{startDate}} по {{endDate}}.
  - id: payment
    title: "3. Стоимость и оплата"
    content: |
      Общая стоимость составляет {{amount}} руб.
      Порядок оплаты: {{paymentTerms}}.
  - id: liability
    title: "4. Ответственность сторон"
    content: |
      Стороны несут ответственность за неисполнение обязательств
      в соответствии с действующим законодательством РФ.
  - id: termination
    title: "5. Расторжение договора"
    content: |
      Договор может быть расторгнут по соглашению сторон
      или в одностороннем порядке с уведомлением за 14 дней.
  - id: signatures
    title: "6. Подписи"
    content: |
      Исполнитель: _________________ {{freelancerName}}
      Заказчик:   _________________ {{clientName}}

fields:
  - key: freelancerName
    label: "Ваше имя / ИП"
    type: text
    required: true
    placeholder: "Иванов Иван Иванович"
  - key: clientName
    label: "Название клиента"
    type: text
    required: true
    placeholder: "ООО Ромашка"
  - key: projectDescription
    label: "Описание работ"
    type: textarea
    required: true
    placeholder: "Разработка сайта-визитки"
  - key: startDate
    label: "Дата начала"
    type: date
    required: true
  - key: endDate
    label: "Дата окончания"
    type: date
    required: true
  - key: amount
    label: "Сумма (руб.)"
    type: number
    required: true
    placeholder: "50000"
  - key: paymentTerms
    label: "Условия оплаты"
    type: text
    required: true
    placeholder: "50% предоплата, 50% после сдачи"
```

`data/templates/contract.en.yaml`:
```yaml
title: "Freelance Service Agreement"
sections:
  - id: parties
    title: "1. Parties"
    content: |
      This Agreement is entered into between {{freelancerName}} ("Contractor")
      and {{clientName}} ("Client").
  - id: scope
    title: "2. Scope of Work"
    content: |
      Contractor agrees to perform: {{projectDescription}}.
      Timeline: {{startDate}} to {{endDate}}.
  - id: payment
    title: "3. Payment"
    content: |
      Total fee: ${{amount}}.
      Payment terms: {{paymentTerms}}.
  - id: liability
    title: "4. Limitation of Liability"
    content: |
      Contractor's liability is limited to the total fees paid under this Agreement.
  - id: termination
    title: "5. Termination"
    content: |
      Either party may terminate with 14 days written notice.
  - id: signatures
    title: "6. Signatures"
    content: |
      Contractor: _________________ {{freelancerName}}
      Client:     _________________ {{clientName}}

fields:
  - key: freelancerName
    label: "Your name"
    type: text
    required: true
    placeholder: "John Smith"
  - key: clientName
    label: "Client name"
    type: text
    required: true
    placeholder: "Acme Inc."
  - key: projectDescription
    label: "Scope of work"
    type: textarea
    required: true
    placeholder: "Design and develop a marketing website"
  - key: startDate
    label: "Start date"
    type: date
    required: true
  - key: endDate
    label: "End date"
    type: date
    required: true
  - key: amount
    label: "Amount ($)"
    type: number
    required: true
    placeholder: "2000"
  - key: paymentTerms
    label: "Payment terms"
    type: text
    required: true
    placeholder: "50% upfront, 50% on delivery"
```

`data/templates/nda.ru.yaml`:
```yaml
title: "Соглашение о неразглашении (NDA)"
sections:
  - id: parties
    title: "1. Стороны"
    content: |
      {{disclosingParty}} («Раскрывающая сторона») и
      {{receivingParty}} («Получающая сторона»)
      заключили настоящее Соглашение о неразглашении.
  - id: definition
    title: "2. Конфиденциальная информация"
    content: |
      Под конфиденциальной информацией понимается: {{confidentialInfo}}.
  - id: obligations
    title: "3. Обязательства"
    content: |
      Получающая сторона обязуется не раскрывать конфиденциальную
      информацию третьим лицам и использовать её исключительно
      в целях сотрудничества сторон.
  - id: duration
    title: "4. Срок действия"
    content: |
      Настоящее Соглашение действует в течение {{duration}} с даты подписания.
  - id: signatures
    title: "5. Подписи"
    content: |
      Раскрывающая сторона: _________________ {{disclosingParty}}
      Получающая сторона:   _________________ {{receivingParty}}

fields:
  - key: disclosingParty
    label: "Раскрывающая сторона"
    type: text
    required: true
    placeholder: "ООО Технологии"
  - key: receivingParty
    label: "Получающая сторона"
    type: text
    required: true
    placeholder: "Иванов Иван Иванович"
  - key: confidentialInfo
    label: "Что считается конфиденциальным"
    type: textarea
    required: true
    placeholder: "исходный код, финансовые данные, клиентская база"
  - key: duration
    label: "Срок действия"
    type: text
    required: true
    placeholder: "2 лет"
```

`data/templates/nda.en.yaml`:
```yaml
title: "Non-Disclosure Agreement (NDA)"
sections:
  - id: parties
    title: "1. Parties"
    content: |
      {{disclosingParty}} ("Disclosing Party") and
      {{receivingParty}} ("Receiving Party")
      enter into this Non-Disclosure Agreement.
  - id: definition
    title: "2. Confidential Information"
    content: |
      "Confidential Information" means: {{confidentialInfo}}.
  - id: obligations
    title: "3. Obligations"
    content: |
      Receiving Party agrees to hold Confidential Information in strict
      confidence and not disclose it to any third party.
  - id: duration
    title: "4. Term"
    content: |
      This Agreement remains in effect for {{duration}} from the date of signing.
  - id: signatures
    title: "5. Signatures"
    content: |
      Disclosing Party: _________________ {{disclosingParty}}
      Receiving Party:  _________________ {{receivingParty}}

fields:
  - key: disclosingParty
    label: "Disclosing Party"
    type: text
    required: true
    placeholder: "Acme Inc."
  - key: receivingParty
    label: "Receiving Party"
    type: text
    required: true
    placeholder: "John Smith"
  - key: confidentialInfo
    label: "What counts as confidential"
    type: textarea
    required: true
    placeholder: "source code, financial data, client lists"
  - key: duration
    label: "Duration"
    type: text
    required: true
    placeholder: "2 years"
```

- [ ] **Step 4: Реализовать `lib/template.ts`**

```typescript
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
```

- [ ] **Step 5: Запустить — убедиться что PASS**

```bash
npx jest template --no-coverage
```

- [ ] **Step 6: Commit**

```bash
git add lib/template.ts data/templates/ __tests__/lib/template.test.ts
git commit -m "feat: YAML template system — contract + NDA (RU/EN)"
```

---

### Task 5: Generator (generator.ts)

**Files:**
- Create: `lib/generator.ts`
- Create: `__tests__/lib/generator.test.ts`

- [ ] **Step 1: Написать failing тесты**

`__tests__/lib/generator.test.ts`:
```typescript
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
```

- [ ] **Step 2: Запустить — убедиться что FAIL**

```bash
npx jest generator --no-coverage
```

- [ ] **Step 3: Реализовать `lib/generator.ts`**

```typescript
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
```

- [ ] **Step 4: Запустить — убедиться что PASS**

```bash
npx jest generator --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add lib/generator.ts __tests__/lib/generator.test.ts
git commit -m "feat: template placeholder engine"
```

---

### Task 6: PDF Component (pdf.tsx)

**Files:**
- Create: `lib/pdf.tsx`

- [ ] **Step 1: Реализовать PDF-компонент**

`lib/pdf.tsx`:
```tsx
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { FilledTemplate } from '@/lib/generator'

const styles = StyleSheet.create({
  page: { padding: 60, fontSize: 11, fontFamily: 'Helvetica', lineHeight: 1.6 },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 16, marginBottom: 4 },
  content: { fontSize: 11, color: '#333' },
  watermark: {
    position: 'absolute', top: '40%', left: '10%',
    fontSize: 48, color: '#e0e0e0', opacity: 0.4,
    transform: 'rotate(-30deg)',
  },
})

type Props = {
  doc: FilledTemplate
  watermark?: boolean
}

export function ClausifyDocument({ doc, watermark = false }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {watermark && <Text style={styles.watermark}>CLAUSIFY DEMO</Text>}
        <Text style={styles.title}>{doc.title}</Text>
        {doc.sections.map(section => (
          <View key={section.id}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.content}>{section.content}</Text>
          </View>
        ))}
      </Page>
    </Document>
  )
}
```

> Примечание: `@react-pdf/renderer` не покрывается Jest легко из-за нативных зависимостей. PDF-компонент тестируется интеграционно в Task 8.

- [ ] **Step 2: Commit**

```bash
git add lib/pdf.tsx
git commit -m "feat: React-PDF document component"
```

---

### Task 7: Auth API Routes

**Files:**
- Create: `app/api/auth/register/route.ts`
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Create: `__tests__/api/register.test.ts`
- Create: `__tests__/api/login.test.ts`

- [ ] **Step 1: Написать failing тесты для register**

`__tests__/api/register.test.ts`:
```typescript
import { POST } from '@/app/api/auth/register/route'
import { readUsers } from '@/lib/storage'
import fs from 'fs'
import path from 'path'

const TMP_USERS = path.join(process.cwd(), '__tests__/tmp/users.json')

jest.mock('@/lib/storage', () => {
  const actual = jest.requireActual('@/lib/storage')
  return {
    ...actual,
    readUsers: (file?: string) => actual.readUsers(file ?? TMP_USERS),
    writeUsers: (users: any, file?: string) => actual.writeUsers(users, file ?? TMP_USERS),
  }
})

beforeEach(() => {
  fs.mkdirSync(path.dirname(TMP_USERS), { recursive: true })
  fs.writeFileSync(TMP_USERS, '[]')
})
afterEach(() => fs.rmSync(path.dirname(TMP_USERS), { recursive: true, force: true }))

function makeRequest(body: object) {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201', async () => {
    const res = await POST(makeRequest({ email: 'new@test.com', password: 'pass1234' }))
    expect(res.status).toBe(201)
    const users = readUsers(TMP_USERS)
    expect(users).toHaveLength(1)
    expect(users[0].email).toBe('new@test.com')
  })

  it('rejects duplicate email with 409', async () => {
    await POST(makeRequest({ email: 'dup@test.com', password: 'pass1234' }))
    const res = await POST(makeRequest({ email: 'dup@test.com', password: 'pass1234' }))
    expect(res.status).toBe(409)
  })

  it('rejects short password with 400', async () => {
    const res = await POST(makeRequest({ email: 'x@test.com', password: '123' }))
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Запустить — убедиться что FAIL**

```bash
npx jest register --no-coverage
```

- [ ] **Step 3: Реализовать register route**

`app/api/auth/register/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { readUsers, writeUsers, type User } from '@/lib/storage'
import { hashPassword, signToken, COOKIE_NAME, TTL_SECONDS } from '@/lib/auth'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: 'Email and password (min 6 chars) required' }, { status: 400 })
  }

  const users = readUsers()
  if (users.find(u => u.email === email)) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const user: User = {
    id: randomUUID(),
    email,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
    plan: 'free',
  }
  writeUsers([...users, user])

  const token = await signToken({ userId: user.id, email: user.email })
  const res = NextResponse.json({ ok: true }, { status: 201 })
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: TTL_SECONDS, path: '/' })
  return res
}
```

- [ ] **Step 4: Написать failing тесты для login**

`__tests__/api/login.test.ts`:
```typescript
import { POST as register } from '@/app/api/auth/register/route'
import { POST as login } from '@/app/api/auth/login/route'
import fs from 'fs'
import path from 'path'

const TMP_USERS = path.join(process.cwd(), '__tests__/tmp/users2.json')

jest.mock('@/lib/storage', () => {
  const actual = jest.requireActual('@/lib/storage')
  return {
    ...actual,
    readUsers: (f?: string) => actual.readUsers(f ?? TMP_USERS),
    writeUsers: (u: any, f?: string) => actual.writeUsers(u, f ?? TMP_USERS),
  }
})

beforeEach(() => {
  fs.mkdirSync(path.dirname(TMP_USERS), { recursive: true })
  fs.writeFileSync(TMP_USERS, '[]')
})
afterEach(() => fs.rmSync(path.dirname(TMP_USERS), { recursive: true, force: true }))

function req(body: object) {
  return new Request('http://localhost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await register(req({ email: 'user@test.com', password: 'correct123' }))
  })

  it('returns 200 and sets cookie on correct credentials', async () => {
    const res = await login(req({ email: 'user@test.com', password: 'correct123' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('set-cookie')).toContain('clausify_session')
  })

  it('returns 401 on wrong password', async () => {
    const res = await login(req({ email: 'user@test.com', password: 'wrong' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 on unknown email', async () => {
    const res = await login(req({ email: 'ghost@test.com', password: 'any' }))
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 5: Реализовать login и logout routes**

`app/api/auth/login/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { readUsers } from '@/lib/storage'
import { verifyPassword, signToken, COOKIE_NAME, TTL_SECONDS } from '@/lib/auth'

export async function POST(req: Request) {
  const { email, password } = await req.json()
  const user = readUsers().find(u => u.email === email)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  const token = await signToken({ userId: user.id, email: user.email })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: TTL_SECONDS, path: '/' })
  return res
}
```

`app/api/auth/logout/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/auth'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE_NAME)
  return res
}
```

- [ ] **Step 6: Запустить тесты**

```bash
npx jest register login --no-coverage
```
Ожидаем: PASS

- [ ] **Step 7: Commit**

```bash
git add app/api/auth/ __tests__/api/register.test.ts __tests__/api/login.test.ts
git commit -m "feat: auth API routes — register, login, logout"
```

---

### Task 8: Middleware (защита роутов)

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Реализовать middleware**

`middleware.ts`:
```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

const PROTECTED = ['/dashboard', '/api/documents']

export async function middleware(req: NextRequest) {
  const isProtected = PROTECTED.some(p => req.nextUrl.pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token || !(await verifyToken(token))) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/documents/:path*'],
}
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: middleware — JWT auth guard for protected routes"
```

---

### Task 9: Generate API Route

**Files:**
- Create: `app/api/generate/route.ts`
- Create: `__tests__/api/generate.test.ts`

- [ ] **Step 1: Написать failing тесты**

`__tests__/api/generate.test.ts`:
```typescript
import { POST } from '@/app/api/generate/route'

// Mock pdf renderer — нет нативных deps в Jest
jest.mock('@react-pdf/renderer', () => ({
  renderToBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-pdf')),
  Document: 'Document',
  Page: 'Page',
  Text: 'Text',
  View: 'View',
  StyleSheet: { create: (s: any) => s },
}))

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
  it('returns PDF buffer for valid contract request', async () => {
    const res = await POST(req({ type: 'contract', lang: 'ru', fields: contractFields, guest: true }))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/pdf')
  })

  it('returns 400 for missing required field', async () => {
    const res = await POST(req({ type: 'contract', lang: 'ru', fields: { freelancerName: 'Alice' }, guest: true }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for unknown document type', async () => {
    const res = await POST(req({ type: 'invoice', lang: 'ru', fields: {}, guest: true }))
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Запустить — убедиться что FAIL**

```bash
npx jest generate --no-coverage
```

- [ ] **Step 3: Реализовать generate route**

`app/api/generate/route.ts`:
```typescript
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

  // Determine if authenticated
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
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
```

- [ ] **Step 4: Запустить — убедиться что PASS**

```bash
npx jest generate --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add app/api/generate/ __tests__/api/generate.test.ts
git commit -m "feat: PDF generate API with guest rate-limit"
```

---

### Task 10: Documents History API

**Files:**
- Create: `app/api/documents/route.ts`

- [ ] **Step 1: Реализовать route**

`app/api/documents/route.ts`:
```typescript
import { NextResponse, type NextRequest } from 'next/server'
import path from 'path'
import { readHistory } from '@/lib/storage'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

const USERS_DIR = path.join(process.cwd(), 'data/users')

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifyToken(token) : null
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userDir = path.join(USERS_DIR, session.userId)
  const history = readHistory(userDir)
  return NextResponse.json(history)
}
```

> Middleware уже защищает этот роут — двойная проверка здесь для явности.

- [ ] **Step 2: Commit**

```bash
git add app/api/documents/route.ts
git commit -m "feat: documents history API"
```

---

### Task 11: UI — Landing Page

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Реализовать layout**

`app/layout.tsx`:
```tsx
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
```

- [ ] **Step 2: Реализовать лендинг**

`app/page.tsx`:
```tsx
import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b">
        <span className="font-bold text-xl">Clausify</span>
        <div className="flex gap-4">
          <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign in</Link>
          <Link href="/register" className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
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

      {/* Features */}
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
```

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx app/layout.tsx
git commit -m "feat: landing page"
```

---

### Task 12: UI — Auth Pages

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `app/(auth)/layout.tsx`

- [ ] **Step 1: Auth layout**

`app/(auth)/layout.tsx`:
```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl border w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Login page**

`app/(auth)/login/page.tsx`:
```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (res.ok) {
      router.push('/dashboard')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Login failed')
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Sign in to Clausify</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" required />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="bg-black text-white py-2 rounded-lg hover:bg-gray-800">Sign in</button>
      </form>
      <p className="mt-4 text-sm text-gray-500 text-center">
        No account? <Link href="/register" className="underline">Register</Link>
      </p>
    </>
  )
}
```

- [ ] **Step 3: Register page**

`app/(auth)/register/page.tsx`:
```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (res.ok) {
      router.push('/dashboard')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Registration failed')
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Create account</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" required />
        <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" required minLength={6} />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="bg-black text-white py-2 rounded-lg hover:bg-gray-800">Create account</button>
      </form>
      <p className="mt-4 text-sm text-gray-500 text-center">
        Have an account? <Link href="/login" className="underline">Sign in</Link>
      </p>
    </>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat: login and register pages"
```

---

### Task 13: UI — Generate Page

**Files:**
- Create: `app/(app)/generate/[type]/page.tsx`
- Create: `app/(app)/layout.tsx`

- [ ] **Step 1: App layout**

`app/(app)/layout.tsx`:
```tsx
import Link from 'next/link'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-4 border-b">
        <Link href="/" className="font-bold text-xl">Clausify</Link>
        <div className="flex gap-4">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
          <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/' }}
            className="text-gray-600 hover:text-gray-900">Sign out</button>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Generate page**

`app/(app)/generate/[type]/page.tsx`:
```tsx
'use client'
import { use, useState, useEffect } from 'react'

type FieldDef = {
  key: string; label: string; type: string; required: boolean; placeholder?: string
}

export default function GeneratePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params)
  const [lang, setLang] = useState<'ru' | 'en'>('ru')
  const [fields, setFields] = useState<FieldDef[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/template?type=${type}&lang=${lang}`)
      .then(r => r.json())
      .then(data => { setFields(data.fields ?? []); setValues({}) })
  }, [type, lang])

  async function handleGenerate() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, lang, fields: values, guest: true }),
    })
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-${lang}.pdf`
      a.click()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Generation failed')
    }
    setLoading(false)
  }

  const title = type === 'contract'
    ? (lang === 'ru' ? 'Договор на оказание услуг' : 'Freelance Contract')
    : (lang === 'ru' ? 'Соглашение о неразглашении' : 'NDA')

  return (
    <div className="max-w-2xl mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex rounded-lg overflow-hidden border">
          {(['ru', 'en'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-4 py-2 text-sm font-medium ${lang === l ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {fields.map(field => (
          <div key={field.key} className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea rows={3} placeholder={field.placeholder ?? ''}
                value={values[field.key] ?? ''}
                onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black resize-none" />
            ) : (
              <input type={field.type} placeholder={field.placeholder ?? ''}
                value={values[field.key] ?? ''}
                onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

      <button onClick={handleGenerate} disabled={loading}
        className="mt-8 w-full bg-black text-white py-3 rounded-lg text-lg hover:bg-gray-800 disabled:opacity-50">
        {loading ? 'Generating...' : 'Download PDF'}
      </button>

      <p className="mt-3 text-xs text-gray-400 text-center">
        Guest mode: PDF includes watermark. <a href="/register" className="underline">Register</a> to remove it.
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Добавить `/api/template` route для клиентского запроса полей**

`app/api/template/route.ts`:
```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { loadTemplate } from '@/lib/template'

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type')
  const lang = req.nextUrl.searchParams.get('lang')
  if (!['contract', 'nda'].includes(type ?? '')) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  if (!['ru', 'en'].includes(lang ?? '')) return NextResponse.json({ error: 'Invalid lang' }, { status: 400 })
  try {
    const template = loadTemplate(type as 'contract' | 'nda', lang as 'ru' | 'en')
    return NextResponse.json({ fields: template.fields, title: template.title })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 404 })
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/ app/api/template/
git commit -m "feat: document generator UI with language switcher"
```

---

### Task 14: UI — Dashboard

**Files:**
- Create: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Реализовать dashboard**

`app/(app)/dashboard/page.tsx`:
```tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import path from 'path'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { readHistory } from '@/lib/storage'

const USERS_DIR = path.join(process.cwd(), 'data/users')

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const session = token ? await verifyToken(token) : null
  if (!session) redirect('/login')

  const userDir = path.join(USERS_DIR, session.userId)
  const history = readHistory(userDir)

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/generate/contract" className="border px-4 py-2 rounded-lg hover:bg-gray-50">New Contract</Link>
          <Link href="/generate/nda" className="border px-4 py-2 rounded-lg hover:bg-gray-50">New NDA</Link>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-xl mb-4">No documents yet</p>
          <Link href="/generate/contract" className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800">
            Create your first document
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {history.slice().reverse().map(entry => (
            <div key={entry.id} className="flex items-center justify-between p-4 border rounded-xl">
              <div>
                <p className="font-medium capitalize">{entry.type} — {entry.lang.toUpperCase()}</p>
                <p className="text-sm text-gray-400">{new Date(entry.createdAt).toLocaleDateString()}</p>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">saved</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/dashboard/
git commit -m "feat: dashboard — document history"
```

---

### Task 15: Final Check

- [ ] **Step 1: Запустить все тесты**

```bash
npx jest --no-coverage
```
Ожидаем: все PASS

- [ ] **Step 2: Запустить dev-сервер и проверить вручную**

```bash
npm run dev
```

Проверить:
- `http://localhost:3000` — лендинг открывается
- `http://localhost:3000/generate/contract` — форма загружается, RU/EN переключается
- Заполнить форму → нажать Download PDF → файл скачивается с watermark
- Зарегистрироваться → перенаправление на dashboard
- Dashboard показывает "No documents yet"

- [ ] **Step 3: Финальный commit**

```bash
git add -A
git commit -m "feat: Clausify MVP — complete"
```
