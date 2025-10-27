/**
 * Результат валидации SQL
 */
export interface SQLValidationResult {
  isValid: boolean;
  sql: string; // Оригинальный или модифицированный SQL
  errors: string[];
  warnings: string[];
}

/**
 * Whitelist разрешенных ключевых слов SQL
 */
const ALLOWED_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'GROUP BY',
  'ORDER BY',
  'LIMIT',
  'OFFSET',
  'JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'INNER JOIN',
  'ON',
  'AND',
  'OR',
  'NOT',
  'IN',
  'BETWEEN',
  'LIKE',
  'ILIKE',
  'AS',
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'DISTINCT',
  'DATE',
  'DATE_TRUNC',
  'NOW',
  'INTERVAL',
  'CAST',
  'COALESCE',
];

/**
 * Blacklist запрещенных ключевых слов (опасные операции)
 */
const FORBIDDEN_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'CREATE',
  'ALTER',
  'TRUNCATE',
  'EXEC',
  'EXECUTE',
  'GRANT',
  'REVOKE',
  'COMMIT',
  'ROLLBACK',
  'SAVEPOINT',
  'MERGE',
  'COPY',
  'VACUUM',
  'ANALYZE',
  'EXPLAIN',
];

/**
 * Список разрешенных таблиц
 */
const ALLOWED_TABLES = ['sessions', 'events'];

/**
 * Максимальный LIMIT для запросов
 */
const MAX_LIMIT = 1000;

/**
 * Валидация SQL запроса
 * @param sql SQL-запрос для валидации
 * @returns Результат валидации
 */
export function validateSQL(sql: string): SQLValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let modifiedSQL = sql.trim();

  // 1. Проверка на пустоту
  if (!modifiedSQL) {
    errors.push('SQL запрос пустой');
    return { isValid: false, sql: modifiedSQL, errors, warnings };
  }

  // 2. Преобразуем в верхний регистр для проверки (но сохраняем оригинал)
  const upperSQL = modifiedSQL.toUpperCase();

  // 3. Проверка что запрос начинается с SELECT
  if (!upperSQL.trim().startsWith('SELECT')) {
    errors.push('Запрос должен начинаться с SELECT');
    return { isValid: false, sql: modifiedSQL, errors, warnings };
  }

  // 4. Проверка на запрещенные ключевые слова
  for (const forbidden of FORBIDDEN_KEYWORDS) {
    // Используем word boundary для точного поиска
    const regex = new RegExp(`\\b${forbidden}\\b`, 'i');
    if (regex.test(modifiedSQL)) {
      errors.push(`Запрещенная операция: ${forbidden}`);
    }
  }

  // 5. Проверка на SQL injection паттерны
  const injectionPatterns = [
    /;\s*DROP/i,          // ; DROP TABLE
    /;\s*DELETE/i,        // ; DELETE FROM
    /;\s*INSERT/i,        // ; INSERT INTO
    /--/,                 // SQL комментарии --
    /\/\*/,               // Многострочные комментарии /*
    /xp_cmdshell/i,       // SQL Server command execution
    /exec\s*\(/i,         // EXEC()
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(modifiedSQL)) {
      errors.push(`Обнаружен подозрительный паттерн: ${pattern.source}`);
    }
  }

  // 6. Проверка на использование разрешенных таблиц
  const tablePattern = /FROM\s+(\w+)|JOIN\s+(\w+)/gi;
  const tableMatches = modifiedSQL.matchAll(tablePattern);
  
  for (const match of tableMatches) {
    const tableName = (match[1] || match[2]).toLowerCase();
    if (!ALLOWED_TABLES.includes(tableName)) {
      errors.push(`Неразрешенная таблица: ${tableName}. Разрешены: ${ALLOWED_TABLES.join(', ')}`);
    }
  }

  // 7. Проверка и добавление LIMIT если его нет
  if (!upperSQL.includes('LIMIT')) {
    warnings.push(`LIMIT не указан, добавлен автоматически (${MAX_LIMIT})`);
    modifiedSQL = `${modifiedSQL.replace(/;?\s*$/, '')} LIMIT ${MAX_LIMIT}`;
  } else {
    // Проверяем что LIMIT не превышает максимум
    const limitMatch = modifiedSQL.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1]);
      if (limit > MAX_LIMIT) {
        warnings.push(`LIMIT ${limit} превышает максимум ${MAX_LIMIT}, установлен в ${MAX_LIMIT}`);
        modifiedSQL = modifiedSQL.replace(/LIMIT\s+\d+/i, `LIMIT ${MAX_LIMIT}`);
      }
    }
  }

  // 8. Проверка базовой структуры SELECT ... FROM
  if (!upperSQL.includes('FROM')) {
    errors.push('SQL запрос должен содержать FROM clause');
  }

  // 9. Проверка на множественные запросы (через ;)
  const statementCount = modifiedSQL.split(';').filter(s => s.trim()).length;
  if (statementCount > 1) {
    errors.push('Запрещены множественные SQL statements (через ;)');
  }

  // 10. Предупреждения о потенциальных проблемах
  if (upperSQL.includes('SELECT *')) {
    warnings.push('Использование SELECT * не рекомендуется, укажите конкретные колонки');
  }

  if (!upperSQL.includes('WHERE') && !upperSQL.includes('GROUP BY')) {
    warnings.push('Запрос без WHERE clause может вернуть много данных');
  }

  // Результат
  const isValid = errors.length === 0;

  return {
    isValid,
    sql: modifiedSQL,
    errors,
    warnings,
  };
}

/**
 * Проверка безопасности SQL перед выполнением
 * Бросает ошибку если SQL небезопасен
 * @param sql SQL-запрос
 * @returns Валидированный и безопасный SQL
 */
export function ensureSafeSQL(sql: string): string {
  const result = validateSQL(sql);

  if (!result.isValid) {
    throw new Error(`Небезопасный SQL запрос: ${result.errors.join(', ')}`);
  }

  // Выводим предупреждения в консоль
  if (result.warnings.length > 0) {
    console.warn('SQL предупреждения:', result.warnings);
  }

  return result.sql;
}

/**
 * Добавляет LIMIT к SQL если его нет
 * @param sql SQL-запрос
 * @param limit Значение LIMIT (по умолчанию MAX_LIMIT)
 * @returns SQL с LIMIT
 */
export function addLimitIfMissing(sql: string, limit: number = MAX_LIMIT): string {
  const upperSQL = sql.toUpperCase();
  
  if (upperSQL.includes('LIMIT')) {
    return sql;
  }

  return `${sql.replace(/;?\s*$/, '')} LIMIT ${Math.min(limit, MAX_LIMIT)}`;
}

/**
 * Очистка SQL от комментариев и лишних пробелов
 * @param sql SQL-запрос
 * @returns Очищенный SQL
 */
export function sanitizeSQL(sql: string): string {
  let cleaned = sql;

  // Удаляем однострочные комментарии --
  cleaned = cleaned.replace(/--[^\n]*/g, '');

  // Удаляем многострочные комментарии /* */
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

  // Удаляем множественные пробелы
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Удаляем пробелы в начале и конце
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Получить список разрешенных таблиц
 */
export function getAllowedTables(): string[] {
  return [...ALLOWED_TABLES];
}

/**
 * Получить максимальный LIMIT
 */
export function getMaxLimit(): number {
  return MAX_LIMIT;
}

