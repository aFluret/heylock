/**
 * @file: lib/error-handler.ts
 * @description: Централизованная обработка ошибок
 * @created: 2025-10-27
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class AIServiceError extends AppError {
  constructor(message: string) {
    super(message, 500, 'AI_SERVICE_ERROR');
    this.name = 'AIServiceError';
  }
}

/**
 * Форматирование ошибки для клиента
 */
export function formatErrorForClient(error: unknown): {
  error: string;
  code?: string;
  details?: string;
} {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      error: 'Произошла внутренняя ошибка',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    };
  }

  return {
    error: 'Неизвестная ошибка',
  };
}

/**
 * Логирование ошибок
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}] ` : '';
  
  console.error(`${timestamp} ${contextStr}Error:`, error);
  
  if (error instanceof Error) {
    console.error('Stack:', error.stack);
  }
}

/**
 * Человеко-читаемые сообщения об ошибках
 */
export const ERROR_MESSAGES = {
  // Validation
  EMPTY_MESSAGE: 'Сообщение не может быть пустым',
  INVALID_MESSAGE: 'Некорректный формат сообщения',
  
  // Database
  DB_CONNECTION_FAILED: 'Не удалось подключиться к базе данных',
  DB_QUERY_FAILED: 'Ошибка при выполнении запроса',
  DB_NO_DATA: 'Данных не найдено',
  
  // AI Service
  AI_API_KEY_MISSING: 'API ключ Gemini не настроен',
  AI_REQUEST_FAILED: 'Не удалось получить ответ от AI',
  AI_INVALID_RESPONSE: 'AI вернул некорректный ответ',
  AI_SQL_GENERATION_FAILED: 'Не удалось сгенерировать SQL запрос',
  AI_INTERPRETATION_FAILED: 'Не удалось интерпретировать результаты',
  
  // SQL Validation
  SQL_VALIDATION_FAILED: 'SQL запрос не прошел валидацию',
  SQL_DANGEROUS_OPERATION: 'Обнаружена опасная операция в SQL',
  SQL_TOO_COMPLEX: 'SQL запрос слишком сложный',
  
  // General
  INTERNAL_ERROR: 'Произошла внутренняя ошибка',
  TIMEOUT: 'Превышено время ожидания ответа',
  RATE_LIMIT: 'Слишком много запросов, попробуйте позже',
} as const;

/**
 * Retry механизм для нестабильных операций
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

