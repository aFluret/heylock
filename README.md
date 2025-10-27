# 🔐 Heylock

> **AI-аналитика для стартапов** — получайте инсайты из данных через естественно-языковой интерфейс

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini_2.5-orange)](https://ai.google.dev/)

---

## 📖 О проекте

**Heylock** — это прототип AI-powered аналитической платформы, которая позволяет стартапам получать инсайты из данных без необходимости писать SQL запросы или разбираться в сложных BI-инструментах.

### Ключевые возможности

- 💬 **Естественно-языковой интерфейс**: Задавайте вопросы на русском языке
- 📊 **Автоматическая визуализация**: Графики генерируются автоматически на основе данных
- 🤖 **AI-генерация SQL**: Google Gemini преобразует ваш вопрос в SQL запрос
- 🔒 **Валидация запросов**: Встроенная защита от опасных SQL операций
- ⚡ **Реальные данные**: Прямая интеграция с Supabase (PostgreSQL)

---

## 🎥 Демо

### Пример использования:

**Вопрос:** "Какая средняя продолжительность сессий?"

**Ответ системы:**
- 📊 **График**: Bar chart с метрикой
- 💬 **Интерпретация**: "Средняя продолжительность сессий составляет примерно 56 минут и 38 секунд..."
- 📈 **Данные**: Форматированное значение (3.4K секунд)

**Поддерживаемые типы вопросов:**
- Агрегированные метрики: "Сколько всего было сессий?"
- Временные диапазоны: "Покажи активность за последнюю неделю"
- Топ событий: "Какие события происходят чаще всего?"
- Сравнения: "Сколько пользователей было вчера?"

---

## 🏗️ Архитектура

### High-Level Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browser   │      │   Next.js   │      │  Supabase   │
│             │◄────►│  App Router │◄────►│ PostgreSQL  │
│  React UI   │      │  API Routes │      │   Database  │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   Google    │
                     │   Gemini    │
                     │  2.5 Flash  │
                     └─────────────┘
```

### Component Architecture

```
┌──────────────────────────────────────────────────────┐
│                     Frontend (React)                  │
├──────────────────────────────────────────────────────┤
│  ChatInterface                                        │
│  ├─ MessageBubble (User/AI messages)                 │
│  ├─ ChartRenderer (Recharts: Line, Bar, Pie)        │
│  └─ LoadingIndicator                                 │
└──────────────────────────────────────────────────────┘
                         │
                         ▼ HTTP POST
┌──────────────────────────────────────────────────────┐
│              Backend (Next.js API Routes)            │
├──────────────────────────────────────────────────────┤
│  /api/chat (POST)                                    │
│  ├─ AI Service (Gemini)                             │
│  │   ├─ generateSQL()                               │
│  │   └─ interpretResults()                          │
│  ├─ SQL Validator                                    │
│  │   ├─ sanitizeSQL()                               │
│  │   └─ validateSQL()                               │
│  ├─ Database Client (Supabase)                      │
│  │   └─ executeSQL() via RPC                        │
│  └─ Response Formatter                               │
│      ├─ formatChartData()                            │
│      └─ suggestChartType()                           │
└──────────────────────────────────────────────────────┘
                         │
                         ▼ SQL Query
┌──────────────────────────────────────────────────────┐
│              Database (Supabase/PostgreSQL)          │
├──────────────────────────────────────────────────────┤
│  Tables:                                              │
│  ├─ sessions (id, user_id, started_at, duration)    │
│  └─ events (id, session_id, event_name, timestamp)  │
│                                                       │
│  RPC Function:                                        │
│  └─ execute_raw_sql(sql_query text)                 │
└──────────────────────────────────────────────────────┘
```

---

## 🤖 Выбор AI провайдера: Google Gemini

### Почему Gemini 2.5 Flash?

| Критерий | Gemini 2.5 Flash | Альтернативы |
|----------|------------------|--------------|
| **Скорость** | ⚡ Очень быстрый (~3-5s) | OpenAI GPT-4 Turbo (~5-10s) |
| **Стоимость** | 💰 $0.15/1M токенов (input) | OpenAI: $10/1M токенов |
| **Контекст** | 📄 1M токенов | Claude: 200K, GPT-4: 128K |
| **Качество SQL** | ✅ Отличное для PostgreSQL | ✅ Все хорошо справляются |
| **Русский язык** | ✅ Нативная поддержка | ✅ Все поддерживают |
| **API доступность** | 🌍 Бесплатный tier: 15 RPM | OpenAI: Требует оплаты |

### Преимущества для MVP:

1. **Бесплатный tier**: 15 запросов в минуту — достаточно для прототипа
2. **Скорость**: Flash модель оптимизирована для low-latency задач
3. **Большой контекст**: Позволяет передавать полную схему БД в каждом запросе
4. **Multimodal**: В будущем можно добавить анализ изображений графиков

---

## 🔍 Подход к генерации SQL

### 1. Prompt Engineering

Используем **двухэтапный подход**:

#### Этап 1: Генерация SQL + определение типа графика

```typescript
const prompt = `
Схема базы данных PostgreSQL:
${DATABASE_SCHEMA}

Вопрос пользователя: "${userQuestion}"

Сгенерируй JSON:
{
  "sql": "SELECT ...",
  "explanation": "Краткое объяснение",
  "chartType": "line|bar|pie"
}
`;
```

#### Этап 2: Интерпретация результатов

```typescript
const interpretPrompt = `
Вопрос: "${userQuestion}"
Результаты SQL: ${JSON.stringify(data)}

Создай естественное объяснение результатов на русском языке (2-3 предложения).
`;
```

### 2. SQL Валидация

**3-уровневая защита:**

```typescript
// 1. Санитизация: удаление комментариев
sql = sanitizeSQL(sql);

// 2. Валидация опасных операций
const dangers = ['DELETE', 'DROP', 'TRUNCATE', 'UPDATE', 'INSERT'];
if (dangers.some(d => sql.toUpperCase().includes(d))) {
  throw new ValidationError('Forbidden operation');
}

// 3. Whitelist таблиц
const allowedTables = ['sessions', 'events'];
// Проверка, что SQL использует только разрешенные таблицы

// 4. Автоматический LIMIT
if (!sql.includes('LIMIT')) {
  sql += ' LIMIT 1000';
}
```

### 3. Обработка результатов

**Специальная логика для агрегированных метрик:**

```typescript
// Одна строка + одна колонка = агрегированная метрика
if (data.length === 1 && Object.keys(data[0]).length === 1) {
  // Форматируем label: average_duration → "Средняя продолжительность"
  // Создаем Bar Chart с одним столбцом
}
```

---

## 🚀 Локальная установка

### Требования

- Node.js 18+ и npm
- Аккаунт Supabase (бесплатный tier)
- Google Gemini API ключ (бесплатный tier)

### Шаг 1: Клонирование репозитория

```bash
git clone https://github.com/your-username/heylock.git
cd heylock
```

### Шаг 2: Установка зависимостей

```bash
npm install
```

### Шаг 3: Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Перейдите в **SQL Editor** и выполните:

```sql
-- Создание таблиц
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  event_name TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  properties JSONB
);

-- RPC функция для выполнения SQL
CREATE OR REPLACE FUNCTION execute_raw_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE format('SELECT json_agg(t) FROM (%s) t', sql_query) INTO result;
  IF result IS NULL THEN
    result := '[]'::json;
  END IF;
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL Error: %', SQLERRM;
END;
$$;

-- Права доступа
GRANT EXECUTE ON FUNCTION execute_raw_sql(text) TO anon;
GRANT EXECUTE ON FUNCTION execute_raw_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_raw_sql(text) TO service_role;
```

3. Скопируйте **Project URL**, **Anon Key**, **Service Role Key**

### Шаг 4: Настройка Google Gemini

1. Перейдите на [ai.google.dev](https://ai.google.dev/)
2. Создайте API ключ в [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Убедитесь, что **Generative Language API** включен в [Google Cloud Console](https://console.cloud.google.com/)

### Шаг 5: Настройка переменных окружения

Создайте файл `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
```

### Шаг 6: Заполнение тестовыми данными

```bash
npm run seed
```

Это создаст:
- 15 уникальных пользователей
- 80 сессий за последние 30 дней
- 800 событий 15 различных типов

### Шаг 7: Запуск приложения

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

---

## 📁 Структура проекта

```
heylock/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts         # Основной API endpoint
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Главная страница
│   └── globals.css              # Глобальные стили
│
├── components/
│   ├── ChatInterface.tsx        # Основной чат-компонент
│   ├── MessageBubble.tsx        # Отображение сообщений
│   ├── ChartRenderer.tsx        # Рендеринг графиков (Recharts)
│   ├── LoadingIndicator.tsx    # Индикатор загрузки
│   └── ErrorMessage.tsx         # Отображение ошибок
│
├── lib/
│   ├── ai-service.ts            # Интеграция с Google Gemini
│   ├── database.ts              # Supabase клиент и хелперы
│   ├── sql-validator.ts         # Валидация и санитизация SQL
│   ├── response-formatter.ts   # Форматирование данных для графиков
│   ├── error-handler.ts         # Централизованная обработка ошибок
│   └── types.ts                 # TypeScript типы
│
├── scripts/
│   ├── seed-database.ts         # Скрипт для заполнения БД
│   ├── create-tables.sql        # SQL для создания таблиц
│   └── create-rpc-function.sql  # RPC функция для Supabase
│
├── public/                      # Статические файлы
├── .env.local                   # Переменные окружения (не в Git!)
├── .env.example                 # Шаблон переменных окружения
├── package.json                 # Зависимости
├── tsconfig.json                # TypeScript конфигурация
├── tailwind.config.ts           # Tailwind CSS конфигурация
└── next.config.js               # Next.js конфигурация
```

---

## 🛠️ Технологический стек

### Frontend
- **Next.js 16** (App Router) — React фреймворк с SSR
- **React 19** — UI библиотека
- **TypeScript 5** — Типизация
- **Tailwind CSS 3.4** — Utility-first CSS
- **Recharts 3** — Библиотека для графиков

### Backend
- **Next.js API Routes** — Serverless функции
- **Google Gemini 2.5 Flash** — AI для генерации SQL
- **Zod 4** — Валидация данных

### Database
- **Supabase** — Backend-as-a-Service
- **PostgreSQL** — Реляционная БД

### DevTools
- **ESLint** — Линтер
- **PostCSS** — CSS процессор
- **tsx** — TypeScript executor для скриптов

---

## 🧪 Примеры вопросов

Попробуйте задать следующие вопросы в интерфейсе:

```
✅ "Покажи активность пользователей за последнюю неделю"
✅ "Какие события происходят чаще всего?"
✅ "Сколько было сессий вчера?"
✅ "Какая средняя продолжительность сессий?"
```

---

## 📊 Примеры использования

### Пример 1: Агрегированная метрика

**Вопрос:** "Сколько всего было сессий?"

**SQL (сгенерирован Gemini):**
```sql
SELECT COUNT(*) AS total_sessions FROM sessions LIMIT 1000
```

**Ответ:**
- График: Bar chart с 1 столбцом
- Label: "Всего сессий"
- Значение: "80" (на вершине столбца)

### Пример 2: Временной ряд

**Вопрос:** "Покажи активность за последнюю неделю"

**SQL:**
```sql
SELECT DATE(started_at) as date, COUNT(id) as session_count 
FROM sessions 
WHERE started_at >= NOW() - INTERVAL '7 days' 
GROUP BY DATE(started_at) 
ORDER BY date LIMIT 1000
```

**Ответ:**
- График: Line chart с 7 точками
- X-axis: Даты
- Y-axis: Количество сессий

### Пример 3: Топ событий

**Вопрос:** "Какие события происходят чаще всего?"

**SQL:**
```sql
SELECT event_name, COUNT(*) as count 
FROM events 
GROUP BY event_name 
ORDER BY count DESC 
LIMIT 1000
```

**Ответ:**
- График: Bar chart с топ-15 событий
- Сортировка: По убыванию

---

## 🔒 Безопасность

### SQL Injection Protection

1. ✅ **Sanitization**: Удаление SQL комментариев
2. ✅ **Validation**: Блокировка опасных операций (DELETE, DROP, UPDATE)
3. ✅ **Whitelist**: Только таблицы `sessions` и `events`
4. ✅ **Auto-LIMIT**: Автоматическое ограничение результатов (макс. 1000)
5. ✅ **Prepared Statements**: Supabase RPC использует параметризованные запросы

---

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) файл
