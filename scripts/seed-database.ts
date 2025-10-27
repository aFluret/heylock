/**
 * @file: scripts/seed-database.ts
 * @description: Скрипт для заполнения базы данных тестовыми данными
 * @dependencies: @supabase/supabase-js, dotenv
 * @created: 2025-10-27
 * 
 * Использование: npm run seed
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Session, Event } from '../lib/types';

// Загружаем переменные окружения из .env.local
config({ path: '.env.local' });

// Конфигурация
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Ошибка: Отсутствуют переменные окружения');
  console.error('Убедитесь, что .env.local содержит:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Параметры генерации
const NUM_USERS = 15;
const NUM_SESSIONS = 80;
const NUM_EVENTS = 800;
const DAYS_BACK = 30;

// Типы событий
const EVENT_TYPES = [
  'page_view',
  'button_click',
  'form_submit',
  'video_play',
  'video_pause',
  'image_view',
  'link_click',
  'search',
  'download',
  'purchase',
  'add_to_cart',
  'remove_from_cart',
  'login',
  'logout',
  'signup',
];

// Утилиты для генерации случайных данных
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

function randomDate(daysBack: number): Date {
  const now = new Date();
  const daysAgo = randomInt(0, daysBack);
  const hoursAgo = randomInt(0, 23);
  const minutesAgo = randomInt(0, 59);
  
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hoursAgo, minutesAgo, 0, 0);
  
  return date;
}

function generateUserId(index: number): string {
  return `user_${String(index).padStart(3, '0')}`;
}

async function clearExistingData() {
  console.log('🗑️  Очистка существующих данных...');
  
  // Удаляем события (сначала, т.к. есть FK)
  const { error: eventsError } = await supabase
    .from('events')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Удаляем все
  
  if (eventsError) {
    console.error('Ошибка при удалении событий:', eventsError);
  }
  
  // Удаляем сессии
  const { error: sessionsError } = await supabase
    .from('sessions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Удаляем все
  
  if (sessionsError) {
    console.error('Ошибка при удалении сессий:', sessionsError);
  }
  
  console.log('✅ Существующие данные удалены\n');
}

async function generateSessions(): Promise<Session[]> {
  console.log(`📊 Генерация ${NUM_SESSIONS} сессий для ${NUM_USERS} пользователей...`);
  
  const sessions: any[] = [];
  
  for (let i = 0; i < NUM_SESSIONS; i++) {
    const userId = generateUserId(randomInt(1, NUM_USERS));
    const startedAt = randomDate(DAYS_BACK);
    
    // Длительность сессии от 1 минуты до 2 часов
    const durationSeconds = randomInt(60, 7200);
    const endedAt = new Date(startedAt.getTime() + durationSeconds * 1000);
    
    sessions.push({
      user_id: userId,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds,
    });
  }
  
  // Сортируем по времени (старые первые)
  sessions.sort((a, b) => 
    new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
  );
  
  // Вставляем в БД батчами по 50
  const batchSize = 50;
  const insertedSessions: Session[] = [];
  
  for (let i = 0; i < sessions.length; i += batchSize) {
    const batch = sessions.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('sessions')
      .insert(batch)
      .select();
    
    if (error) {
      console.error('Ошибка при вставке сессий:', error);
      throw error;
    }
    
    if (data) {
      insertedSessions.push(...data as Session[]);
    }
    
    process.stdout.write(`\r  Вставлено сессий: ${Math.min(i + batchSize, sessions.length)}/${sessions.length}`);
  }
  
  console.log(`\n✅ Создано ${insertedSessions.length} сессий\n`);
  return insertedSessions;
}

async function generateEvents(sessions: Session[]): Promise<void> {
  console.log(`🎯 Генерация ${NUM_EVENTS} событий...`);
  
  const events: any[] = [];
  
  for (let i = 0; i < NUM_EVENTS; i++) {
    const session = randomElement(sessions);
    const sessionStart = new Date(session.started_at);
    const sessionEnd = session.ended_at ? new Date(session.ended_at) : new Date();
    
    // Время события между началом и концом сессии
    const eventTime = new Date(
      sessionStart.getTime() + 
      Math.random() * (sessionEnd.getTime() - sessionStart.getTime())
    );
    
    const eventName = randomElement(EVENT_TYPES);
    
    // Генерируем properties в зависимости от типа события
    let properties: Record<string, any> = {};
    
    switch (eventName) {
      case 'page_view':
        properties = {
          page: randomElement(['/home', '/about', '/products', '/contact', '/blog', '/pricing']),
          referrer: randomElement(['google.com', 'direct', 'facebook.com', 'twitter.com']),
        };
        break;
      case 'button_click':
        properties = {
          button_id: `btn_${randomInt(1, 20)}`,
          button_text: randomElement(['Buy Now', 'Learn More', 'Sign Up', 'Download']),
        };
        break;
      case 'purchase':
        properties = {
          amount: randomInt(10, 500),
          currency: 'USD',
          product_id: `prod_${randomInt(1, 50)}`,
        };
        break;
      case 'search':
        properties = {
          query: randomElement(['analytics', 'dashboard', 'reports', 'api', 'integration']),
          results_count: randomInt(0, 100),
        };
        break;
      default:
        properties = {
          source: 'web',
          device: randomElement(['desktop', 'mobile', 'tablet']),
        };
    }
    
    events.push({
      session_id: session.id,
      event_name: eventName,
      timestamp: eventTime.toISOString(),
      properties,
    });
  }
  
  // Вставляем в БД батчами по 100
  const batchSize = 100;
  
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    const { error } = await supabase
      .from('events')
      .insert(batch);
    
    if (error) {
      console.error('Ошибка при вставке событий:', error);
      throw error;
    }
    
    process.stdout.write(`\r  Вставлено событий: ${Math.min(i + batchSize, events.length)}/${events.length}`);
  }
  
  console.log(`\n✅ Создано ${events.length} событий\n`);
}

async function printStatistics() {
  console.log('📈 Статистика базы данных:\n');
  
  // Количество сессий
  const { count: sessionsCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true });
  
  // Количество событий
  const { count: eventsCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true });
  
  // Уникальные пользователи
  const { data: users } = await supabase
    .from('sessions')
    .select('user_id');
  
  const uniqueUsers = new Set(users?.map(s => s.user_id) || []).size;
  
  // Топ событий
  const { data: topEvents } = await supabase
    .from('events')
    .select('event_name');
  
  const eventCounts: Record<string, number> = {};
  topEvents?.forEach(e => {
    eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1;
  });
  
  const topEventsList = Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  console.log(`  📊 Сессий: ${sessionsCount}`);
  console.log(`  🎯 Событий: ${eventsCount}`);
  console.log(`  👥 Уникальных пользователей: ${uniqueUsers}`);
  console.log(`\n  🏆 Топ-5 событий:`);
  topEventsList.forEach(([name, count], index) => {
    console.log(`     ${index + 1}. ${name}: ${count}`);
  });
  
  console.log('');
}

async function main() {
  console.log('🚀 Запуск seed-скрипта для Heylock\n');
  console.log('⚙️  Параметры:');
  console.log(`   - Пользователей: ${NUM_USERS}`);
  console.log(`   - Сессий: ${NUM_SESSIONS}`);
  console.log(`   - Событий: ${NUM_EVENTS}`);
  console.log(`   - Период: последние ${DAYS_BACK} дней\n`);
  
  try {
    // Проверка подключения
    const { error: connectionError } = await supabase
      .from('sessions')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      throw new Error(`Не удалось подключиться к Supabase: ${connectionError.message}`);
    }
    
    // Очистка данных
    await clearExistingData();
    
    // Генерация сессий
    const sessions = await generateSessions();
    
    // Генерация событий
    await generateEvents(sessions);
    
    // Вывод статистики
    await printStatistics();
    
    console.log('✅ Seed-скрипт завершен успешно!');
    console.log('\n💡 Теперь можно тестировать запросы:');
    console.log('   - npm run dev');
    console.log('   - Откройте http://localhost:3000\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  }
}

main();

