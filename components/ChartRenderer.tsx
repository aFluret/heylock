'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import type { ChartData, ChartType } from '@/lib/types';

interface ChartRendererProps {
  data: ChartData;
  chartType: ChartType;
}

export default function ChartRenderer({ data, chartType }: ChartRendererProps) {
  // Проверка на пустые данные
  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">Нет данных для отображения</p>
      </div>
    );
  }

  // Преобразуем данные в формат для Recharts
  const chartData = data.labels.map((label, index) => {
    const dataPoint: any = { name: label };
    data.datasets.forEach((dataset) => {
      dataPoint[dataset.label] = dataset.data[index];
    });
    return dataPoint;
  });

  // Цвета для графиков
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Line Chart
  if (chartType === 'line') {
    return (
      <div className="w-full h-80 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '14px' }}
            />
            {data.datasets.map((dataset, idx) => (
              <Line
                key={dataset.label}
                type="monotone"
                dataKey={dataset.label}
                stroke={colors[idx % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[idx % colors.length], r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Bar Chart
  if (chartType === 'bar') {
    return (
      <div className="w-full h-80 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '14px' }}
            />
            {data.datasets.map((dataset, idx) => (
              <Bar
                key={dataset.label}
                dataKey={dataset.label}
                fill={colors[idx % colors.length]}
                radius={[4, 4, 0, 0]}
              >
                <LabelList 
                  dataKey={dataset.label} 
                  position="top" 
                  style={{ fontSize: '14px', fontWeight: 'bold', fill: '#374151' }}
                  formatter={(value: any) => {
                    const numValue = Number(value);
                    if (isNaN(numValue)) return value;
                    // Форматируем большие числа
                    if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`;
                    if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}K`;
                    // Если число дробное, показываем 1 знак после запятой
                    if (numValue % 1 !== 0) return numValue.toFixed(1);
                    return numValue.toString();
                  }}
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Pie Chart
  if (chartType === 'pie') {
    // Для Pie chart используем только первый dataset
    const pieData = data.labels.map((label, index) => ({
      name: label,
      value: data.datasets[0]?.data[index] || 0,
    }));

    return (
      <div className="w-full h-80 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '14px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}
