-- ============================================
-- Таблица: sessions
-- Описание: Хранит информацию о пользовательских сессиях
-- ============================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Комментарии к полям
COMMENT ON TABLE sessions IS 'Пользовательские сессии';
COMMENT ON COLUMN sessions.id IS 'Уникальный идентификатор сессии';
COMMENT ON COLUMN sessions.user_id IS 'ID пользователя (строка для упрощения MVP)';
COMMENT ON COLUMN sessions.started_at IS 'Время начала сессии';
COMMENT ON COLUMN sessions.ended_at IS 'Время окончания сессии (nullable)';
COMMENT ON COLUMN sessions.duration_seconds IS 'Длительность сессии в секундах';
COMMENT ON COLUMN sessions.created_at IS 'Время создания записи';

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);

-- ============================================
-- Таблица: events
-- Описание: Хранит события, происходящие в рамках сессий
-- ============================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  properties JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Комментарии к полям
COMMENT ON TABLE events IS 'События в рамках пользовательских сессий';
COMMENT ON COLUMN events.id IS 'Уникальный идентификатор события';
COMMENT ON COLUMN events.session_id IS 'FK к таблице sessions';
COMMENT ON COLUMN events.event_name IS 'Название события (например, page_view, button_click)';
COMMENT ON COLUMN events.timestamp IS 'Время события';
COMMENT ON COLUMN events.properties IS 'Дополнительные свойства события в JSON';
COMMENT ON COLUMN events.created_at IS 'Время создания записи';

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- GIN индекс для JSONB поля (для поиска по properties)
CREATE INDEX IF NOT EXISTS idx_events_properties ON events USING GIN (properties);

-- ============================================
-- Проверочные запросы
-- ============================================

-- Вывести информацию о созданных таблицах
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('sessions', 'events')
ORDER BY table_name;

-- Вывести все индексы
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('sessions', 'events')
ORDER BY tablename, indexname;

-- ============================================
-- Row Level Security (RLS)
-- Для MVP отключаем RLS, т.к. нет аутентификации
-- ============================================

ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Примечание: В production версии с аутентификацией нужно будет:
-- 1. Включить RLS: ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- 2. Создать политики доступа для разных пользователей

-- ============================================
-- Тестовые данные (опционально, можно удалить)
-- ============================================

-- Проверка: вставить тестовую сессию
DO $$
DECLARE
  test_session_id UUID;
BEGIN
  -- Вставляем тестовую сессию
  INSERT INTO sessions (user_id, started_at, ended_at, duration_seconds)
  VALUES ('test_user_1', NOW() - INTERVAL '1 hour', NOW(), 3600)
  RETURNING id INTO test_session_id;

  -- Вставляем тестовое событие
  INSERT INTO events (session_id, event_name, timestamp, properties)
  VALUES (
    test_session_id,
    'page_view',
    NOW() - INTERVAL '30 minutes',
    '{"page": "/home", "referrer": "google.com"}'::jsonb
  );

  RAISE NOTICE 'Test data inserted successfully. Session ID: %', test_session_id;
END $$;

-- Проверка: вывести тестовые данные
SELECT 
  s.id as session_id,
  s.user_id,
  s.started_at,
  COUNT(e.id) as event_count
FROM sessions s
LEFT JOIN events e ON e.session_id = s.id
GROUP BY s.id, s.user_id, s.started_at
ORDER BY s.started_at DESC
LIMIT 5;

-- ============================================
-- Готово! Таблицы созданы.
-- Следующий шаг: запустить seed-скрипт для генерации данных
-- Команда: npm run seed
-- ============================================

