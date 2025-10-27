/**
 * @file: lib/types.ts
 * @description: TypeScript типы и интерфейсы для проекта
 * @created: 2025-10-27
 */

// Тип сообщения в чате
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  chartData?: ChartData;
  chartType?: ChartType;
  timestamp?: Date;
}

// Типы графиков
export type ChartType = 'line' | 'bar' | 'pie';

// Данные для графика
export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

// Ответ от API /api/chat
export interface APIResponse {
  explanation: string;
  chartData?: ChartData;
  chartType?: ChartType;
  error?: string;
}

// Запрос к API /api/chat
export interface APIRequest {
  message: string;
}

// Таблицы БД
export interface Session {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface Event {
  id: string;
  session_id: string;
  event_name: string;
  timestamp: string;
  properties: Record<string, any> | null;
  created_at: string;
}

// Ответ от Gemini API (генерация SQL)
export interface GeminiSQLResponse {
  sql: string;
  chartType: ChartType;
  explanation: string;
}

