/**
 * @file: scripts/test-connection.ts
 * @description: Тестовый скрипт для проверки подключения к Supabase
 * @created: 2025-10-27
 * 
 * Использование: npx tsx scripts/test-connection.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Загружаем переменные окружения
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Ошибка: Отсутствуют переменные окружения');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('🔌 Тестирование подключения к Supabase...\n');
  
  try {
    // Проверка 1: Подключение к таблице sessions
    console.log('1️⃣  Проверка таблицы sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .limit(5);
    
    if (sessionsError) throw sessionsError;
    console.log(`   ✅ Получено ${sessions?.length || 0} сессий`);
    
    // Проверка 2: Подключение к таблице events
    console.log('\n2️⃣  Проверка таблицы events...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(5);
    
    if (eventsError) throw eventsError;
    console.log(`   ✅ Получено ${events?.length || 0} событий`);
    
    // Проверка 3: JOIN запрос
    console.log('\n3️⃣  Проверка JOIN запроса...');
    const { data: joined, error: joinError } = await supabase
      .from('sessions')
      .select(`
        id,
        user_id,
        started_at,
        events (
          id,
          event_name
        )
      `)
      .limit(3);
    
    if (joinError) throw joinError;
    console.log(`   ✅ JOIN работает, получено ${joined?.length || 0} записей`);
    
    // Проверка 4: Агрегация
    console.log('\n4️⃣  Проверка статистики...');
    const { count: totalSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   ✅ Всего сессий: ${totalSessions}`);
    console.log(`   ✅ Всего событий: ${totalEvents}`);
    
    console.log('\n🎉 Все проверки пройдены успешно!');
    console.log('\n💡 База данных готова к работе. Можете приступать к разработке AI-логики.\n');
    
  } catch (error) {
    console.error('\n❌ Ошибка при тестировании:', error);
    process.exit(1);
  }
}

testConnection();

