/**
 * @file: lib/database.ts
 * @description: Supabase клиент и утилиты для работы с базой данных
 * @dependencies: @supabase/supabase-js
 * @created: 2025-10-27
 */

import { createClient } from '@supabase/supabase-js';
import type { Session, Event } from './types';

// Проверка наличия переменных окружения
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Создание Supabase клиента
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Клиент с service role (для серверных операций)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Выполнить произвольный SQL запрос
 * @param sql SQL-запрос для выполнения
 * @param timeout Таймаут в миллисекундах (по умолчанию 5000)
 * @returns Результат запроса
 */
export async function executeSQL(sql: string, timeout: number = 5000): Promise<any[]> {
  try {
    // Используем RPC функцию для выполнения SQL
    // Примечание: В production лучше использовать подготовленные запросы
    const { data, error } = await Promise.race([
      supabaseAdmin.rpc('execute_sql', { query: sql }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      )
    ]) as any;

    if (error) {
      console.error('SQL execution error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

/**
 * Получить все сессии
 */
export async function getSessions(limit: number = 100): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Получить все события
 */
export async function getEvents(limit: number = 100): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return data || [];
}

/**
 * Получить события для конкретной сессии
 */
export async function getEventsBySession(sessionId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching events by session:', error);
    throw error;
  }

  return data || [];
}

/**
 * Проверка подключения к базе данных
 */
export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sessions')
      .select('count')
      .limit(1);

    return !error;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

