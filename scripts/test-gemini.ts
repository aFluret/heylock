/**
 * @file: scripts/test-gemini.ts
 * @description: Тестовый скрипт для проверки Gemini API
 * @created: 2025-10-27
 * 
 * Использование: npx tsx scripts/test-gemini.ts
 */

import { config } from 'dotenv';
import { testGeminiConnection, generateSQL, interpretResults } from '../lib/ai-service';

// Загружаем переменные окружения
config({ path: '.env.local' });

async function main() {
  console.log('🧪 Тестирование Google Gemini API\n');

  try {
    // Тест 1: Проверка подключения
    console.log('1️⃣  Проверка подключения к Gemini...');
    const isConnected = await testGeminiConnection();
    
    if (!isConnected) {
      console.error('❌ Не удалось подключиться к Gemini API');
      process.exit(1);
    }
    console.log('✅ Подключение успешно!\n');

    // Тест 2: Генерация SQL
    console.log('2️⃣  Тест генерации SQL запроса...');
    console.log('   Вопрос: "Покажи активность пользователей за последнюю неделю"\n');
    
    const sqlResponse = await generateSQL('Покажи активность пользователей за последнюю неделю');
    
    console.log('   📝 Результат:');
    console.log('   SQL:', sqlResponse.sql);
    console.log('   Тип графика:', sqlResponse.chartType);
    console.log('   Пояснение:', sqlResponse.explanation);
    console.log('   ✅ SQL сгенерирован успешно!\n');

    // Тест 3: Интерпретация результатов
    console.log('3️⃣  Тест интерпретации результатов...');
    
    const mockData = [
      { date: '2025-10-20', users: 12 },
      { date: '2025-10-21', users: 15 },
      { date: '2025-10-22', users: 18 },
      { date: '2025-10-23', users: 14 },
      { date: '2025-10-24', users: 20 },
      { date: '2025-10-25', users: 22 },
      { date: '2025-10-26', users: 19 },
    ];
    
    const interpretation = await interpretResults(
      mockData,
      'Покажи активность пользователей за последнюю неделю'
    );
    
    console.log('   📊 Интерпретация:');
    console.log('   ', interpretation.replace(/\n/g, '\n    '));
    console.log('   ✅ Интерпретация сгенерирована!\n');

    // Тест 4: Другой тип вопроса
    console.log('4️⃣  Тест с другим вопросом...');
    console.log('   Вопрос: "Какие события происходят чаще всего?"\n');
    
    const sqlResponse2 = await generateSQL('Какие события происходят чаще всего?');
    
    console.log('   📝 Результат:');
    console.log('   SQL:', sqlResponse2.sql);
    console.log('   Тип графика:', sqlResponse2.chartType);
    console.log('   ✅ SQL сгенерирован успешно!\n');

    console.log('🎉 Все тесты пройдены успешно!');
    console.log('\n💡 Gemini API работает корректно. Можно приступать к интеграции с фронтендом.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  }
}

main();

