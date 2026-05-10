# Clausify — Design Spec
**Date:** 2026-05-10  
**Status:** Approved

## Overview
SaaS-генератор юридических документов (контракт фрилансера, NDA) для B2C/B2B. Шаблоны хранятся в YAML. Без БД и платёжных интеграций на первом этапе.

**Цель по выручке:** $1000/month (~35 Pro × $15 + ~10 Agency × $49)

## Stack
- Next.js 15 (App Router), TypeScript
- `@react-pdf/renderer` — генерация PDF на сервере
- `bcryptjs` — хэширование паролей
- `jose` — JWT
- `yaml` — парсинг шаблонов

## Типы документов
- Контракт фрилансера (RU + EN)
- NDA (RU + EN)

## Архитектура

### Структура файлов
```
project-001/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/register/page.tsx
│   ├── (app)/dashboard/page.tsx
│   ├── (app)/generate/[type]/page.tsx
│   ├── api/auth/          # login, register, logout
│   ├── api/generate/      # генерация PDF
│   ├── api/documents/     # история пользователя
│   └── page.tsx           # лендинг
├── data/
│   ├── users.json
│   ├── guest-limits.json
│   ├── templates/
│   │   ├── contract.ru.yaml
│   │   ├── contract.en.yaml
│   │   ├── nda.ru.yaml
│   │   └── nda.en.yaml
│   └── users/<id>/history.json
├── lib/
│   ├── auth.ts
│   ├── generator.ts
│   └── pdf.ts
```

### Модели данных

**users.json**
```json
[{ "id": "uuid", "email": "...", "passwordHash": "...", "createdAt": "...", "plan": "free" }]
```

**history.json** (per user)
```json
[{ "id": "uuid", "type": "contract", "lang": "ru", "createdAt": "...", "fields": {} }]
```

**guest-limits.json**
```json
{ "127.0.0.1": { "count": 2, "date": "2026-05-10" } }
```

**template.yaml структура**
```yaml
title: "..."
sections:
  - id: parties
    title: "1. Стороны"
    content: "{{freelancerName}} и {{clientName}}..."
fields:
  - key: freelancerName
    label: "Ваше имя"
    type: text
    required: true
```

## Пользовательские флоу

**Гость:** Лендинг → Выбор документа → Язык → Форма → Превью → PDF (watermark) → CTA регистрации

**Авторизованный:** Логин → Dashboard → Новый документ → Форма → Превью → PDF (без watermark) → Сохраняется в истории

## Экраны

| Экран | Роут |
|---|---|
| Лендинг | `/` |
| Генератор | `/generate/[type]` |
| Dashboard | `/dashboard` |
| Логин | `/login` |
| Регистрация | `/register` |

## Безопасность
- bcrypt rounds: 10
- JWT в httpOnly + Secure куке, TTL 7 дней
- Middleware защищает `/dashboard` и `/api/documents`

## Гостевые ограничения
- 3 генерации в сутки на IP
- Watermark в PDF
- Нет сохранения истории

## Out of scope (v1)
- Платёжные интеграции
- OAuth (Google/GitHub)
- Кастомные шаблоны пользователя
- Email-уведомления
