import React, { useState, useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { LoadingIndicator } from './LoadingIndicator';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
  isError?: boolean;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    const savedSessionId = localStorage.getItem('sessionId');
    
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
    
    if (savedSessionId) {
      setSessionId(savedSessionId);
    } else {
      const newSessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      setSessionId(newSessionId);
      localStorage.setItem('sessionId', newSessionId);
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  const callChatAPI = async (userMessage: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: sessionId
        }),
      });

      if (!response.ok) {
        // Handle different error cases
        if (response.status === 0 || !response.status) {
          throw new Error('API server is not running. Please start the development server with API support.');
        }
        
        const data = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: Date.now().toString() + '-ai',
        content: data.response,
        type: 'ai',
        timestamp: new Date(data.timestamp),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling chat API:', error);
      
      let errorContent = 'Sorry, I encountered an error. Please try again.';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorContent = '🔧 API server is not running. To enable chat functionality, please run the full development setup with API support.';
      } else if (error instanceof Error) {
        errorContent = error.message;
      }
      
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        content: errorContent,
        type: 'ai',
        timestamp: new Date(),
        isError: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      type: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Call actual API
    await callChatAPI(content);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 md:px-6 md:py-4 shadow-sm">
        <h1 className="text-lg md:text-xl text-gray-900">Six Axis Studios support</h1>
        <p className="text-xs md:text-sm text-gray-600 mt-1">We're here to help you with any questions</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-3 md:px-6 md:py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center text-gray-500">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg mb-2">Welcome to 6 Axis Studios Support</h3>
              <p className="text-xs md:text-sm">Start a conversation by sending a message below.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && <LoadingIndicator />}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}