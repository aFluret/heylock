import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeminiSQLResponse } from './types';

/**
 * Получить инициализированную модель Gemini
 */
function getModel() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Missing GOOGLE_GEMINI_API_KEY environment variable');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Используем Gemini 2.5 Flash (быстрая и эффективная модель)
  return genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });
}

/**
 * System prompt с описанием схемы базы данных
 */
const DATABASE_SCHEMA = `
Ты — эксперт по аналитике данных и SQL. Твоя задача:
1. Анализировать вопросы пользователей на русском языке
2. Генерировать корректные SQL-запросы к PostgreSQL
3. Определять подходящий тип графика для визуализации

СХЕМА БАЗЫ ДАННЫХ:

Таблица: sessions
- id: UUID (Primary Key)
- user_id: VARCHAR(255) - ID пользователя
- started_at: TIMESTAMPTZ - время начала сессии
- ended_at: TIMESTAMPTZ - время окончания сессии (может быть NULL)
- duration_seconds: INTEGER - длительность сессии в секундах
- created_at: TIMESTAMPTZ - время создания записи

Таблица: events
- id: UUID (Primary Key)
- session_id: UUID (Foreign Key → sessions.id)
- event_name: VARCHAR(255) - название события (например: page_view, button_click, purchase)
- timestamp: TIMESTAMPTZ - время события
- properties: JSONB - дополнительные свойства события
- created_at: TIMESTAMPTZ - время создания записи

ПРАВИЛА ГЕНЕРАЦИИ SQL:
1. Используй ТОЛЬКО SELECT запросы (никаких INSERT, UPDATE, DELETE)
2. Всегда добавляй LIMIT (максимум 1000 строк)
3. Используй агрегации (COUNT, SUM, AVG) где уместно
4. Группируй данные для визуализации (GROUP BY)
5. Сортируй результаты (ORDER BY) для удобства
6. Для временных запросов используй DATE() или DATE_TRUNC()
7. Используй JOIN когда нужно связать sessions и events

ТИПЫ ГРАФИКОВ:
- "line": для временных рядов (активность по дням, тренды)
- "bar": для сравнения категорий (топ событий, сравнение пользователей)
- "pie": для распределения долей (доля каждого типа события)

ПРИМЕРЫ:

Вопрос: "Покажи активность пользователей за последнюю неделю"
SQL: SELECT DATE(started_at) as date, COUNT(DISTINCT user_id) as users FROM sessions WHERE started_at >= NOW() - INTERVAL '7 days' GROUP BY DATE(started_at) ORDER BY date LIMIT 1000
Тип графика: line
Пояснение: Запрос покажет количество уникальных пользователей по дням за последнюю неделю

Вопрос: "Какие события происходят чаще всего?"
SQL: SELECT event_name, COUNT(*) as count FROM events GROUP BY event_name ORDER BY count DESC LIMIT 10
Тип графика: bar
Пояснение: Запрос покажет топ-10 самых частых событий

ФОРМАТ ОТВЕТА:
Верни JSON в следующем формате (без markdown, только чистый JSON):
{
  "sql": "SELECT ...",
  "chartType": "line|bar|pie",
  "explanation": "Краткое пояснение что покажет запрос"
}
`;

/**
 * Генерация SQL запроса из естественно-языкового вопроса
 * @param userQuestion Вопрос пользователя на русском языке
 * @returns Объект с SQL, типом графика и пояснением
 */
export async function generateSQL(userQuestion: string): Promise<GeminiSQLResponse> {
  try {
    const model = getModel();
    
    const prompt = `${DATABASE_SCHEMA}

ВОПРОС ПОЛЬЗОВАТЕЛЯ: "${userQuestion}"

Проанализируй вопрос и верни JSON с SQL-запросом, типом графика и пояснением.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Парсим JSON из ответа (убираем markdown если есть)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Не удалось распарсить JSON из ответа Gemini');
    }

    const parsed: GeminiSQLResponse = JSON.parse(jsonMatch[0]);

    // Валидация ответа
    if (!parsed.sql || !parsed.chartType || !parsed.explanation) {
      throw new Error('Некорректный формат ответа от Gemini');
    }

    return parsed;
  } catch (error) {
    console.error('Ошибка при генерации SQL:', error);
    throw new Error(`Не удалось сгенерировать SQL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Интерпретация результатов запроса
 * @param data Данные из базы данных
 * @param userQuestion Исходный вопрос пользователя
 * @returns Текстовое пояснение результатов
 */
export async function interpretResults(
  data: any[],
  userQuestion: string
): Promise<string> {
  try {
    const model = getModel();
    
    // Если нет данных
    if (!data || data.length === 0) {
      return 'По вашему запросу не найдено данных. Попробуйте изменить временной период или формулировку вопроса.';
    }

    // Формируем промпт для интерпретации
    const prompt = `
Ты — аналитик данных. На основе результатов SQL-запроса дай краткое, понятное пояснение на русском языке.

ВОПРОС ПОЛЬЗОВАТЕЛЯ: "${userQuestion}"

РЕЗУЛЬТАТЫ ЗАПРОСА (первые 10 строк):
${JSON.stringify(data.slice(0, 10), null, 2)}

Всего строк: ${data.length}

Напиши краткое пояснение (2-3 предложения):
1. Что показывают данные
2. Основные выводы или тренды
3. Интересные находки (если есть)

Пиши просто и понятно, без технических терминов.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Ошибка при интерпретации результатов:', error);
    return 'Данные получены успешно, но не удалось сгенерировать текстовое пояснение.';
  }
}

/**
 * Тестовая функция для проверки подключения к Gemini
 */
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const model = getModel();
    const result = await model.generateContent('Скажи "Подключение работает!"');
    const response = await result.response;
    const text = response.text();
    console.log('Gemini ответ:', text);
    return true;
  } catch (error) {
    console.error('Ошибка подключения к Gemini:', error);
    return false;
  }
}

