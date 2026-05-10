'use client'
import { use, useState, useEffect } from 'react'

type FieldDef = {
  key: string
  label: string
  type: string
  required: boolean
  placeholder?: string
}

export default function GeneratePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params)
  const [lang, setLang] = useState<'ru' | 'en'>('ru')
  const [fields, setFields] = useState<FieldDef[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isGuest, setIsGuest] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => setIsGuest(!data.user))
  }, [])

  useEffect(() => {
    fetch(`/api/template?type=${type}&lang=${lang}`)
      .then(r => r.json())
      .then(data => {
        setFields(data.fields ?? [])
        setValues({})
        setFieldErrors({})
      })
  }, [type, lang])

  async function handleGenerate() {
    const missing: Record<string, boolean> = {}
    for (const f of fields) {
      if (f.required && !values[f.key]?.trim()) missing[f.key] = true
    }
    if (Object.keys(missing).length > 0) {
      setFieldErrors(missing)
      setError(lang === 'ru' ? 'Заполните обязательные поля' : 'Please fill in required fields')
      return
    }
    setFieldErrors({})
    setLoading(true)
    setError('')
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, lang, fields: values }),
    })
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-${lang}.pdf`
      a.click()
      URL.revokeObjectURL(url)
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
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-4 py-2 text-sm font-medium ${lang === l ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {fields.map(field => (
          <div key={field.key} className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                rows={3}
                placeholder={field.placeholder ?? ''}
                value={values[field.key] ?? ''}
                onChange={e => {
                  setValues(v => ({ ...v, [field.key]: e.target.value }))
                  setFieldErrors(fe => ({ ...fe, [field.key]: false }))
                }}
                className={`border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black resize-none ${fieldErrors[field.key] ? 'border-red-500' : ''}`}
              />
            ) : (
              <input
                type={field.type}
                placeholder={field.placeholder ?? ''}
                value={values[field.key] ?? ''}
                onChange={e => {
                  setValues(v => ({ ...v, [field.key]: e.target.value }))
                  setFieldErrors(fe => ({ ...fe, [field.key]: false }))
                }}
                className={`border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black ${fieldErrors[field.key] ? 'border-red-500' : ''}`}
              />
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="mt-8 w-full bg-black text-white py-3 rounded-lg text-lg hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? (lang === 'ru' ? 'Генерируем...' : 'Generating...') : (lang === 'ru' ? 'Скачать PDF' : 'Download PDF')}
      </button>

      {isGuest && (
        <p className="mt-3 text-xs text-gray-400 text-center">
          {lang === 'ru' ? 'Гостевой режим: PDF содержит водяной знак.' : 'Guest mode: PDF includes watermark.'}{' '}
          <a href="/register" className="underline">{lang === 'ru' ? 'Зарегистрируйтесь' : 'Register'}</a>{' '}
          {lang === 'ru' ? 'чтобы убрать.' : 'to remove it.'}
        </p>
      )}
    </div>
  )
}
