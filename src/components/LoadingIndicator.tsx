import React from 'react';

export function LoadingIndicator() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
      </div>
      <span className="text-gray-500 text-xs md:text-sm">AI is typing...</span>
    </div>
  );
}