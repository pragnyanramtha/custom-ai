import React from 'react';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    type: 'user' | 'ai';
    timestamp: Date;
    isError?: boolean;
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isUser = message.type === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-3 md:mb-4`}>
      <div className={`max-w-[85%] md:max-w-[80%] ${isUser ? 'order-1' : 'order-2'}`}>
        <div 
          className={`
            rounded-2xl px-3 py-2 md:px-4 md:py-3 break-words
            ${isUser 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto' 
              : 'bg-gray-800 text-white'
            }
            ${message.isError ? 'bg-red-500 text-white italic' : ''}
          `}
        >
          <div className="whitespace-pre-wrap text-sm md:text-base">{message.content}</div>
        </div>
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}