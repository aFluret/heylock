/**
 * Проверка API ключа напрямую через fetch
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

async function checkAPI() {
  console.log('🔑 Проверка API ключа...\n');
  console.log('Длина ключа:', apiKey?.length);
  console.log('Начало ключа:', apiKey?.substring(0, 10) + '...\n');
  
  // Проверка 1: Список моделей
  try {
    console.log('1️⃣  Запрос списка моделей...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    if (!response.ok) {
      console.log(`❌ Ошибка: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log('Ответ:', text.substring(0, 200));
    } else {
      const data = await response.json();
      console.log('✅ Успешно! Доступные модели:');
      if (data.models && Array.isArray(data.models)) {
        data.models.forEach((model: any) => {
          console.log(`   - ${model.name}`);
        });
      }
    }
  } catch (error: any) {
    console.log('❌ Ошибка:', error.message);
  }
  
  console.log('\n2️⃣  Прямой запрос к Gemini API...');
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Привет!' }]
          }]
        })
      }
    );
    
    if (!response.ok) {
      console.log(`❌ Ошибка: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log('Ответ:', text);
    } else {
      const data = await response.json();
      console.log('✅ Ответ получен:', JSON.stringify(data, null, 2).substring(0, 300));
    }
  } catch (error: any) {
    console.log('❌ Ошибка:', error.message);
  }
}

checkAPI();

