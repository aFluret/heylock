/**
 * @file: components/LoadingIndicator.tsx
 * @description: Индикатор загрузки для ожидания ответа AI
 * @created: 2025-10-27
 */

interface LoadingIndicatorProps {
  message?: string;
}

export default function LoadingIndicator({ message = 'AI думает...' }: LoadingIndicatorProps) {
  return (
    <div className="flex items-center space-x-2 py-4 px-6 bg-gray-100 dark:bg-gray-800 rounded-lg animate-fade-in">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>
    </div>
  );
}
