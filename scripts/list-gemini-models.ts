/**
 * @file: scripts/list-gemini-models.ts
 * @description: Вывод списка доступных моделей Gemini
 * @created: 2025-10-27
 */

import { config } from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GOOGLE_GEMINI_API_KEY не найден');
  process.exit(1);
}

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey!);
    
    console.log('📋 Получение списка доступных моделей...\n');
    
    // Попробуем разные способы (включая новые названия)
    const models = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest', 
      'gemini-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'models/gemini-pro',
      'models/gemini-1.5-flash',
    ];
    
    let foundWorking = false;
    
    for (const modelName of models) {
      try {
        console.log(`Тестирование: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Привет, это тест!');
        const response = await result.response;
        console.log(`✅ ${modelName} - РАБОТАЕТ!`);
        console.log(`   Ответ: ${response.text()}`);
        console.log(`\n🎉 Найдена рабочая модель: ${modelName}\n`);
        foundWorking = true;
        break; // Если нашли рабочую модель, останавливаемся
      } catch (error: any) {
        const shortError = error.message.includes('404') ? '404 Not Found' : error.message.substring(0, 100);
        console.log(`❌ ${modelName} - не работает (${shortError})\n`);
      }
    }
    
    if (!foundWorking) {
      console.log('\n⚠️  Ни одна модель не доступна. Возможно:');
      console.log('   1. API ключ недействителен');
      console.log('   2. Generative Language API не активирован');
      console.log('   3. Требуется время на активацию (несколько минут)\n');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

listModels();

