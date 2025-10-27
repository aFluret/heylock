/**
 * @file: scripts/test-sql-validator.ts
 * @description: Тестирование SQL валидатора
 * @created: 2025-10-27
 */

import { validateSQL, ensureSafeSQL, sanitizeSQL } from '../lib/sql-validator';

console.log('🧪 Тестирование SQL Validator\n');

// Тест 1: Валидный SQL
console.log('1️⃣  Тест валидного SQL');
const validSQL = 'SELECT user_id, COUNT(*) FROM sessions WHERE started_at >= NOW() - INTERVAL \'7 days\' GROUP BY user_id ORDER BY COUNT(*) DESC';
const result1 = validateSQL(validSQL);
console.log('   SQL:', validSQL);
console.log('   Валиден:', result1.isValid ? '✅' : '❌');
console.log('   Ошибок:', result1.errors.length);
console.log('   Предупреждений:', result1.warnings.length);
if (result1.warnings.length > 0) {
  console.log('   Предупреждения:', result1.warnings);
}
console.log('   Модифицированный SQL:', result1.sql);
console.log();

// Тест 2: SQL без LIMIT
console.log('2️⃣  Тест SQL без LIMIT (должен добавиться)');
const noLimitSQL = 'SELECT * FROM sessions';
const result2 = validateSQL(noLimitSQL);
console.log('   SQL:', noLimitSQL);
console.log('   Валиден:', result2.isValid ? '✅' : '❌');
console.log('   Модифицированный:', result2.sql);
console.log('   Предупреждения:', result2.warnings);
console.log();

// Тест 3: Опасный SQL (DELETE)
console.log('3️⃣  Тест опасного SQL (DELETE)');
const dangerousSQL = 'DELETE FROM sessions WHERE id = 1';
const result3 = validateSQL(dangerousSQL);
console.log('   SQL:', dangerousSQL);
console.log('   Валиден:', result3.isValid ? '✅' : '❌');
console.log('   Ошибки:', result3.errors);
console.log();

// Тест 4: SQL Injection попытка
console.log('4️⃣  Тест SQL Injection');
const injectionSQL = 'SELECT * FROM sessions; DROP TABLE sessions;';
const result4 = validateSQL(injectionSQL);
console.log('   SQL:', injectionSQL);
console.log('   Валиден:', result4.isValid ? '✅' : '❌');
console.log('   Ошибки:', result4.errors);
console.log();

// Тест 5: Неразрешенная таблица
console.log('5️⃣  Тест неразрешенной таблицы');
const unauthorizedTable = 'SELECT * FROM users';
const result5 = validateSQL(unauthorizedTable);
console.log('   SQL:', unauthorizedTable);
console.log('   Валиден:', result5.isValid ? '✅' : '❌');
console.log('   Ошибки:', result5.errors);
console.log();

// Тест 6: SQL с комментариями
console.log('6️⃣  Тест очистки SQL от комментариев');
const commentSQL = 'SELECT * FROM sessions -- это комментарий\nWHERE id = 1 /* и это тоже */';
const sanitized = sanitizeSQL(commentSQL);
console.log('   Оригинал:', commentSQL);
console.log('   Очищенный:', sanitized);
console.log();

// Тест 7: ensureSafeSQL с валидным запросом
console.log('7️⃣  Тест ensureSafeSQL с валидным SQL');
let result7Valid = false;
try {
  const safe = ensureSafeSQL('SELECT event_name, COUNT(*) FROM events GROUP BY event_name');
  console.log('   ✅ SQL безопасен');
  console.log('   Результат:', safe);
  result7Valid = true;
} catch (error: any) {
  console.log('   ❌ Ошибка:', error.message);
}
console.log();

// Тест 8: ensureSafeSQL с опасным запросом
console.log('8️⃣  Тест ensureSafeSQL с опасным SQL');
try {
  const safe = ensureSafeSQL('DROP TABLE sessions');
  console.log('   ❌ SQL прошел (не должен был!)');
} catch (error: any) {
  console.log('   ✅ SQL заблокирован');
  console.log('   Ошибка:', error.message);
}
console.log();

// Тест 9: Большой LIMIT
console.log('9️⃣  Тест превышения LIMIT');
const bigLimitSQL = 'SELECT * FROM sessions LIMIT 5000';
const result9 = validateSQL(bigLimitSQL);
console.log('   SQL:', bigLimitSQL);
console.log('   Валиден:', result9.isValid ? '✅' : '❌');
console.log('   Модифицированный:', result9.sql);
console.log('   Предупреждения:', result9.warnings);
console.log();

// Тест 10: JOIN запрос
console.log('🔟 Тест JOIN запроса');
const joinSQL = 'SELECT s.user_id, e.event_name FROM sessions s JOIN events e ON s.id = e.session_id';
const result10 = validateSQL(joinSQL);
console.log('   SQL:', joinSQL);
console.log('   Валиден:', result10.isValid ? '✅' : '❌');
console.log('   Модифицированный:', result10.sql);
console.log();

console.log('🎉 Все тесты завершены!\n');

// Итоги
const passed = [result1, result2, result10].filter(r => r.isValid).length + (result7Valid ? 1 : 0);
const blocked = [result3, result4, result5].filter(r => !r.isValid).length;

console.log('📊 Итоги:');
console.log(`   ✅ Валидных запросов пропущено: ${passed}`);
console.log(`   🛡️  Опасных запросов заблокировано: ${blocked}`);
console.log(`   ⚠️  Предупреждений выдано: ${[result1, result2, result9].reduce((sum, r) => sum + r.warnings.length, 0)}`);

