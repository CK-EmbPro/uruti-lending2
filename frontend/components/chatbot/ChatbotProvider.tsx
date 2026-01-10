'use client';

import React, { useEffect, useState } from 'react';
import ChatbotWidget from './ChatbotWidget';

/**
 * ChatbotProvider - Wrapper component that provides chatbot widget
 * 
 * This component gets user ID from localStorage tokens and creates/uses session ID.
 * Since both AuthProvider and CustomerPortalProvider are in the root layout,
 * we can access user info via localStorage tokens.
 */
export default function ChatbotProvider() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Get or create session ID and check for user tokens
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get or create session ID
      let sid = localStorage.getItem('chatbot_session_id');
      if (!sid) {
        sid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('chatbot_session_id', sid);
      }
      setSessionId(sid);

      // Try to get user ID from tokens (we'll get it from API when needed)
      // For now, we'll let the widget handle user detection via API calls
      // The backend will identify the user from the JWT token
    }
  }, []);

  // Show chatbot for everyone (authenticated or anonymous)
  // The widget will handle user identification via API
  return <ChatbotWidget userId={userId} sessionId={sessionId || undefined} />;
}

