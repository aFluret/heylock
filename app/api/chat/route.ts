/**
 * @file: app/api/chat/route.ts
 * @description: API endpoint для обработки чат-запросов
 * @created: 2025-10-27
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSQL, interpretResults } from '@/lib/ai-service';
import { validateSQL, ensureSafeSQL } from '@/lib/sql-validator';
import { supabaseAdmin } from '@/lib/database';
import { formatChartData, normalizeData, suggestChartType } from '@/lib/response-formatter';
import type { APIRequest, APIResponse } from '@/lib/types';

/**
 * POST /api/chat
 * Обработка вопросов пользователя и генерация ответов с графиками
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Парсинг запроса
    const body: APIRequest = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Сообщение не может быть пустым' },
        { status: 400 }
      );
    }

    console.log('📩 Получен вопрос:', message);

    // 2. Генерация SQL через Gemini
    console.log('🤖 Генерация SQL через Gemini...');
    const sqlResponse = await generateSQL(message);
    console.log('✅ SQL сгенерирован:', sqlResponse.sql);
    console.log('📊 Тип графика:', sqlResponse.chartType);

    // 3. Валидация SQL
    console.log('🔒 Валидация SQL...');
    const validation = validateSQL(sqlResponse.sql);
    
    if (!validation.isValid) {
      console.error('❌ SQL не прошел валидацию:', validation.errors);
      return NextResponse.json(
        { 
          error: 'Не удалось создать безопасный SQL запрос',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️  SQL предупреждения:', validation.warnings);
    }

    const safeSQL = validation.sql;
    console.log('✅ SQL валидирован:', safeSQL);

    // 4. Выполнение SQL в Supabase
    console.log('💾 Выполнение запроса в Supabase...');
    
    // Используем rpc для выполнения произвольного SQL
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      'execute_raw_sql',
      { sql_query: safeSQL }
    );

    let rawData = rpcData;
    let queryError = rpcError;

    // Fallback: если RPC не работает, используем альтернативный метод
    if (rpcError && rpcError.message?.includes('function') && rpcError.message?.includes('does not exist')) {
      console.log('⚠️  RPC функция не найдена, используем fallback метод...');
      
      const fallbackResult = await executeSimpleQuery(safeSQL);
      rawData = fallbackResult.data;
      queryError = fallbackResult.error;
    }

    if (queryError) {
      console.error('❌ Ошибка выполнения SQL:', queryError);
      return NextResponse.json(
        { 
          error: 'Ошибка при выполнении запроса к базе данных',
          details: queryError.message,
        },
        { status: 500 }
      );
    }

    const data = normalizeData(rawData || []);
    console.log(`✅ Получено ${data.length} записей`);

    // 5. Интерпретация результатов через Gemini
    console.log('🤖 Интерпретация результатов через Gemini...');
    const interpretation = await interpretResults(data, message);
    console.log('✅ Интерпретация:', interpretation);

    // 6. Форматирование данных для графика
    const chartType = sqlResponse.chartType || suggestChartType(data);
    const chartData = formatChartData(data, chartType);

    // 7. Формирование ответа
    const response: APIResponse = {
      explanation: interpretation,
      chartData,
      chartType,
    };

    console.log('✅ Ответ сформирован успешно\n');

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('❌ Ошибка в /api/chat:', error);
    
    return NextResponse.json(
      { 
        error: 'Произошла ошибка при обработке запроса',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Временное решение: выполнение простых SELECT запросов через Supabase SDK
 * В production версии нужно использовать RPC функцию
 */
async function executeSimpleQuery(sql: string): Promise<{ data: any[] | null; error: any }> {
  try {
    // Парсим SQL чтобы определить таблицу и условия
    const upperSQL = sql.toUpperCase();
    
    // Определяем таблицу
    let tableName = 'sessions';
    if (upperSQL.includes('FROM EVENTS')) {
      tableName = 'events';
    }

    // Для прототипа используем простой подход
    // В реальном приложении нужно использовать SQL parser
    
    let query = supabaseAdmin.from(tableName).select('*');
    
    // Извлекаем LIMIT
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1]);
      query = query.limit(limit);
    }

    const { data, error } = await query;
    
    return { data, error };
  } catch (error: any) {
    return { data: null, error };
  }
}

/**
 * GET /api/chat
 * Проверка работоспособности endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'API endpoint работает. Используйте POST для отправки запросов.',
    version: '1.0.0',
  });
}

