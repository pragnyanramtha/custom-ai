import React, { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  const [currentView, setCurrentView] = useState<'chat' | 'admin'>('chat');

  // Check URL path to determine initial view
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('chat');
    }
  }, []);

  // Update URL when view changes
  useEffect(() => {
    const newPath = currentView === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  }, [currentView]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentView(path === '/admin' ? 'admin' : 'chat');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="h-screen w-full">
      {currentView === 'admin' ? <AdminPanel /> : <ChatInterface />}
    </div>
  );
}