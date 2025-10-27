/**
 * @file: components/MessageBubble.tsx
 * @description: Компонент для отображения одного сообщения в чате
 * @dependencies: ChartRenderer
 * @created: 2025-10-27
 */

'use client';

import type { Message } from '@/lib/types';
import ChartRenderer from './ChartRenderer';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
      <div className={`max-w-3xl ${isUser ? 'w-auto' : 'w-full'}`}>
        {/* Сообщение */}
        <div
          className={`
            rounded-lg px-6 py-4 shadow-sm
            ${isUser 
              ? 'bg-blue-500 text-white ml-auto max-w-md' 
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            }
          `}
        >
          {/* Роль отправителя */}
          <div className="flex items-center mb-2">
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mr-2
              ${isUser 
                ? 'bg-blue-600' 
                : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
              }
            `}>
              {isUser ? 'Вы' : 'AI'}
            </div>
            <span className={`text-xs font-medium ${isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
              {isUser ? 'Вы' : 'Heylock AI'}
            </span>
          </div>

          {/* Текст сообщения */}
          <div className={`text-sm leading-relaxed ${isUser ? '' : 'whitespace-pre-wrap'}`}>
            {message.content}
          </div>
        </div>

        {/* График (только для AI ответов) */}
        {!isUser && message.chartData && message.chartType && (
          <div className="mt-4">
            <ChartRenderer data={message.chartData} chartType={message.chartType} />
          </div>
        )}
      </div>
    </div>
  );
}
