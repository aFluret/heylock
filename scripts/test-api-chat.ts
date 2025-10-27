/**
 * @file: scripts/test-api-chat.ts
 * @description: Тестирование API endpoint /api/chat
 * @created: 2025-10-27
 * 
 * ВАЖНО: Перед запуском убедитесь что:
 * 1. npm run dev запущен (приложение работает на localhost:3000)
 * 2. RPC функция execute_raw_sql создана в Supabase
 */

const API_URL = 'http://localhost:3000/api/chat';

interface TestCase {
  name: string;
  message: string;
  expectedChartType?: string;
}

const testCases: TestCase[] = [
  {
    name: 'Активность пользователей за неделю',
    message: 'Покажи активность пользователей за последнюю неделю',
    expectedChartType: 'line',
  },
  {
    name: 'Топ событий',
    message: 'Какие события происходят чаще всего?',
    expectedChartType: 'bar',
  },
  {
    name: 'Количество сессий вчера',
    message: 'Сколько было сессий вчера?',
  },
  {
    name: 'Средняя длительность сессий',
    message: 'Какая средняя длительность сессии?',
  },
];

async function testAPI(testCase: TestCase): Promise<void> {
  console.log(`\n🧪 Тест: ${testCase.name}`);
  console.log(`   Вопрос: "${testCase.message}"`);

  try {
    const startTime = Date.now();
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testCase.message,
      }),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.json();
      console.log(`   ❌ Ошибка ${response.status}:`, error.error);
      if (error.details) {
        console.log(`   Детали:`, error.details);
      }
      return;
    }

    const data = await response.json();

    console.log(`   ✅ Успешно (${duration}ms)`);
    console.log(`   📊 Тип графика: ${data.chartType}`);
    console.log(`   📈 Данных точек: ${data.chartData?.labels?.length || 0}`);
    console.log(`   💬 Пояснение: ${data.explanation?.substring(0, 100)}...`);

    if (testCase.expectedChartType && data.chartType !== testCase.expectedChartType) {
      console.log(`   ⚠️  Ожидался ${testCase.expectedChartType}, получен ${data.chartType}`);
    }

  } catch (error: any) {
    console.log(`   ❌ Ошибка сети:`, error.message);
  }
}

async function checkHealth(): Promise<boolean> {
  console.log('🏥 Проверка доступности API...');
  
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
    });

    if (!response.ok) {
      console.log('❌ API недоступен');
      return false;
    }

    const data = await response.json();
    console.log('✅ API работает:', data.message);
    console.log(`   Версия: ${data.version}\n`);
    return true;
  } catch (error: any) {
    console.log('❌ Ошибка подключения:', error.message);
    console.log('\n💡 Убедитесь что:');
    console.log('   1. npm run dev запущен');
    console.log('   2. Приложение доступно на http://localhost:3000');
    return false;
  }
}

async function main() {
  console.log('🚀 Тестирование API endpoint /api/chat\n');

  // Проверка здоровья API
  const isHealthy = await checkHealth();
  if (!isHealthy) {
    console.log('\n⚠️  Запустите приложение командой: npm run dev');
    process.exit(1);
  }

  // Запуск тестов
  console.log('📝 Запуск тестов...');
  
  for (const testCase of testCases) {
    await testAPI(testCase);
    // Пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 Все тесты завершены!\n');
}

main();

