/**
 * @file: components/ChatInterface.tsx
 * @description: Основной компонент чат-интерфейса
 * @dependencies: MessageBubble, LoadingIndicator
 * @created: 2025-10-27
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import type { Message, APIResponse } from '@/lib/types';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Отправка сообщения
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при обработке запроса');
      }

      const data: APIResponse = await response.json();

      const aiMessage: Message = {
        role: 'assistant',
        content: data.explanation,
        chartData: data.chartData,
        chartType: data.chartType,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Ошибка:', err);
      setError(err.message || 'Произошла ошибка. Попробуйте снова.');
      
      // Добавляем сообщение об ошибке в чат
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ Ошибка: ${err.message || 'Не удалось получить ответ'}. Пожалуйста, попробуйте переформулировать вопрос.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              H
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Heylock</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI Аналитика для стартапов</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Онлайн</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
              H
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Добро пожаловать в Heylock!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              Задавайте вопросы о вашей аналитике на естественном языке, и я предоставлю вам инсайты с графиками.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
              <button
                onClick={() => setInputValue('Покажи активность пользователей за последнюю неделю')}
                className="px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left border border-gray-200 dark:border-gray-700"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  📊 Активность пользователей
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Покажи активность за неделю
                </div>
              </button>
              <button
                onClick={() => setInputValue('Какие события происходят чаще всего?')}
                className="px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left border border-gray-200 dark:border-gray-700"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  🔥 Топ событий
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Самые частые действия
                </div>
              </button>
              <button
                onClick={() => setInputValue('Сколько было сессий вчера?')}
                className="px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left border border-gray-200 dark:border-gray-700"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  📈 Сессии
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Количество сессий вчера
                </div>
              </button>
              <button
                onClick={() => setInputValue('Какая средняя длительность сессии?')}
                className="px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left border border-gray-200 dark:border-gray-700"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  ⏱️ Длительность
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Средняя длительность сессии
                </div>
              </button>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}

        {isLoading && <LoadingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
        {error && (
          <div className="mb-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Задайте вопрос о ваших данных..."
              rows={1}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              style={{ minHeight: '48px', maxHeight: '120px' }}
              disabled={isLoading}
            />
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Нажмите Enter для отправки, Shift+Enter для новой строки
            </div>
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Отправить'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
