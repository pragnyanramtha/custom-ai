import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function MessageInput({ onSendMessage, isLoading }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLength = 1000;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getCharCountColor = () => {
    const ratio = message.length / maxLength;
    if (ratio > 0.9) return 'text-red-500';
    if (ratio > 0.75) return 'text-yellow-500';
    return 'text-gray-400';
  };

  return (
    <div className="border-t bg-white p-4 md:p-6">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 md:p-4">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none resize-none min-h-[32px] max-h-[120px] text-gray-900 placeholder-gray-500 disabled:opacity-50 text-base md:text-base"
            style={{ fontSize: '16px' }}
            rows={1}
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="
              flex items-center justify-center 
              w-8 h-8 md:w-10 md:h-10 
              rounded-full 
              bg-gradient-to-r from-blue-500 to-blue-600 
              text-white transition-all duration-200 
              disabled:opacity-50 disabled:cursor-not-allowed 
              hover:from-blue-600 hover:to-blue-700 
              active:scale-95
              flex-shrink-0
            "
          >
            <Send size={16} className="md:w-5 md:h-5" />
          </button>
        </div>
        <div className={`text-xs mt-2 text-right ${getCharCountColor()}`}>
          {message.length}/{maxLength}
        </div>
      </form>
    </div>
  );
}