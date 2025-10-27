/**
 * @file: lib/response-formatter.ts
 * @description: Форматирование ответов для графиков и UI
 * @created: 2025-10-27
 */

import type { ChartData, ChartType } from './types';

/**
 * Форматирование данных из БД для графиков
 * @param data Данные из базы данных
 * @param chartType Тип графика
 * @returns Данные в формате для Recharts
 */
export function formatChartData(data: any[], chartType: ChartType): ChartData {
  if (!data || data.length === 0) {
    return {
      labels: [],
      datasets: [{
        label: 'Нет данных',
        data: [],
      }],
    };
  }

  // Определяем ключи из первой строки
  const keys = Object.keys(data[0]);
  
  // Специальная обработка для агрегированных метрик (одна строка с одним значением)
  if (data.length === 1 && keys.length === 1) {
    const metricKey = keys[0];
    const metricValue = Number(data[0][metricKey]) || 0;
    
    // Форматируем значение для отображения
    const formattedLabel = formatLabel(metricKey);
    
    return {
      labels: [formattedLabel],
      datasets: [{
        label: formattedLabel,
        data: [metricValue],
        backgroundColor: getColor(metricKey, 0.7),
        borderColor: getColor(metricKey, 1),
        borderWidth: 2,
      }],
    };
  }
  
  // Обычно первый ключ - это label (x-axis), остальные - значения (y-axis)
  const labelKey = keys[0];
  const valueKeys = keys.slice(1);

  // Для line и bar графиков
  if (chartType === 'line' || chartType === 'bar') {
    const labels = data.map(row => String(row[labelKey]));
    
    const datasets = valueKeys.map(key => ({
      label: formatLabel(key),
      data: data.map(row => Number(row[key]) || 0),
      backgroundColor: getColor(key, 0.5),
      borderColor: getColor(key, 1),
      borderWidth: 2,
    }));

    return { labels, datasets };
  }

  // Для pie графиков
  if (chartType === 'pie') {
    const labels = data.map(row => String(row[labelKey]));
    const values = data.map(row => Number(row[valueKeys[0]]) || 0);
    
    const colors = data.map((_, idx) => getColor(`color_${idx}`, 0.8));

    return {
      labels,
      datasets: [{
        label: formatLabel(valueKeys[0]),
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.8', '1')),
        borderWidth: 1,
      }],
    };
  }

  // Default fallback
  return {
    labels: data.map((_, idx) => `Запись ${idx + 1}`),
    datasets: [{
      label: 'Данные',
      data: data.map(row => Number(Object.values(row)[1]) || 0),
    }],
  };
}

/**
 * Форматирование label (преобразование snake_case в читаемый текст)
 * @param key Ключ из БД
 * @returns Отформатированный label
 */
function formatLabel(key: string): string {
  // Словарь для русификации популярных терминов
  const translations: Record<string, string> = {
    'average_duration': 'Средняя продолжительность',
    'avg_duration': 'Средняя продолжительность',
    'total_sessions': 'Всего сессий',
    'session_count': 'Количество сессий',
    'total_users': 'Всего пользователей',
    'user_count': 'Количество пользователей',
    'total_events': 'Всего событий',
    'event_count': 'Количество событий',
    'avg': 'Среднее',
    'count': 'Количество',
    'total': 'Всего',
    'sum': 'Сумма',
    'max': 'Максимум',
    'min': 'Минимум',
    'duration': 'Продолжительность',
    'sessions': 'Сессии',
    'users': 'Пользователи',
    'events': 'События',
  };

  // Проверяем прямое совпадение
  const lowerKey = key.toLowerCase();
  if (translations[lowerKey]) {
    return translations[lowerKey];
  }

  // Преобразуем snake_case в Title Case
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Получить цвет для датасета
 * @param key Ключ датасета
 * @param alpha Прозрачность (0-1)
 * @returns RGBA цвет
 */
function getColor(key: string, alpha: number = 1): string {
  // Предопределенные цвета для популярных метрик
  const colorMap: Record<string, string> = {
    users: `rgba(59, 130, 246, ${alpha})`,        // blue
    count: `rgba(16, 185, 129, ${alpha})`,        // green
    sessions: `rgba(139, 92, 246, ${alpha})`,     // purple
    events: `rgba(245, 158, 11, ${alpha})`,       // amber
    revenue: `rgba(34, 197, 94, ${alpha})`,       // green
    conversions: `rgba(249, 115, 22, ${alpha})`,  // orange
    duration: `rgba(99, 102, 241, ${alpha})`,     // indigo
    average: `rgba(236, 72, 153, ${alpha})`,      // pink
    total: `rgba(20, 184, 166, ${alpha})`,        // teal
    avg: `rgba(236, 72, 153, ${alpha})`,          // pink
  };

  // Проверяем известные ключи
  const lowerKey = key.toLowerCase();
  for (const [keyword, color] of Object.entries(colorMap)) {
    if (lowerKey.includes(keyword)) {
      return color;
    }
  }

  // Генерируем цвет на основе хеша ключа
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash % 360);
  return `hsla(${hue}, 70%, 60%, ${alpha})`;
}

/**
 * Определить подходящий тип графика на основе данных
 * @param data Данные из БД
 * @returns Рекомендуемый тип графика
 */
export function suggestChartType(data: any[]): ChartType {
  if (!data || data.length === 0) {
    return 'bar';
  }

  const keys = Object.keys(data[0]);
  const firstKey = keys[0]?.toLowerCase() || '';
  
  // Если первый ключ содержит 'date', 'time', 'day' - используем линейный график
  if (firstKey.includes('date') || firstKey.includes('time') || firstKey.includes('day')) {
    return 'line';
  }

  // Если много записей (>10) - bar
  if (data.length > 10) {
    return 'bar';
  }

  // Если мало записей (<= 5) и значения составляют целое - pie
  if (data.length <= 5) {
    const values = data.map(row => Number(Object.values(row)[1]) || 0);
    const total = values.reduce((sum, val) => sum + val, 0);
    if (total > 0 && values.every(v => v > 0)) {
      return 'pie';
    }
  }

  // По умолчанию - bar
  return 'bar';
}

/**
 * Валидация и нормализация данных
 * @param data Сырые данные из БД
 * @returns Нормализованные данные
 */
export function normalizeData(data: any[]): any[] {
  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map(row => {
    const normalized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(row)) {
      // Преобразуем даты в строки
      if (value instanceof Date) {
        normalized[key] = value.toISOString().split('T')[0];
      }
      // Преобразуем числа
      else if (typeof value === 'number') {
        normalized[key] = value;
      }
      // Все остальное - в строку
      else {
        normalized[key] = String(value);
      }
    }
    
    return normalized;
  });
}

/**
 * Создать человеко-читаемую сводку данных
 * @param data Данные
 * @returns Краткая сводка
 */
export function createDataSummary(data: any[]): string {
  if (!data || data.length === 0) {
    return 'Данных нет';
  }

  const keys = Object.keys(data[0]);
  const valueKey = keys[1]; // Обычно второй ключ - это значение

  if (!valueKey) {
    return `Найдено ${data.length} записей`;
  }

  const values = data.map(row => Number(row[valueKey]) || 0);
  const total = values.reduce((sum, val) => sum + val, 0);
  const avg = total / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);

  return `Всего: ${total.toFixed(0)}, Среднее: ${avg.toFixed(1)}, Макс: ${max}, Мин: ${min}`;
}

