'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Minimize2, Maximize2, MessageCircle } from 'lucide-react';
import { sendChatbotMessage, getChatbotConversation, type ChatbotResponseDto, type ChatbotMessage } from '@/lib/api/ai';

interface ChatbotWidgetProps {
  userId?: string;
  sessionId?: string;
}

export default function ChatbotWidget({ userId, sessionId }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; quickReplies?: string[] }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate session ID if not provided
  const currentSessionId = sessionId || (typeof window !== 'undefined' ? localStorage.getItem('chatbot_session_id') || `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}` : null);

  useEffect(() => {
    if (currentSessionId && typeof window !== 'undefined') {
      localStorage.setItem('chatbot_session_id', currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (message?: string) => {
    const messageToSend = message || input.trim();
    if (!messageToSend || isLoading) return;

    // Add user message to UI immediately
    const userMessage = { role: 'user' as const, content: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response: ChatbotResponseDto = await sendChatbotMessage(
        {
          message: messageToSend,
          conversationId: conversationId || undefined,
        },
        currentSessionId || undefined,
      );

      // Update conversation ID if this is a new conversation
      if (!conversationId && response.conversationId) {
        setConversationId(response.conversationId);
      }

      // Add assistant response
      const assistantMessage = {
        role: 'assistant' as const,
        content: response.message,
        quickReplies: response.quickReplies,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        role: 'assistant' as const,
        content: 'I apologize, but I encountered an error. Please try again or contact support.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-200 hover:scale-110"
        aria-label="Open chatbot"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl z-50 flex flex-col transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-blue-700 p-1 rounded transition-colors"
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-blue-700 p-1 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Hello! How can I help you today?</p>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleQuickReply('Check loan status')}
                    className="text-xs bg-white px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Check loan status
                  </button>
                  <button
                    onClick={() => handleQuickReply('View applications')}
                    className="text-xs bg-white px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors ml-2"
                  >
                    View applications
                  </button>
                  <button
                    onClick={() => handleQuickReply('Apply for loan')}
                    className="text-xs bg-white px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors ml-2"
                  >
                    Apply for loan
                  </button>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.quickReplies && message.quickReplies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.quickReplies.map((reply, replyIndex) => (
                        <button
                          key={replyIndex}
                          onClick={() => handleQuickReply(reply)}
                          className={`text-xs px-2 py-1 rounded ${
                            message.role === 'user'
                              ? 'bg-blue-500 hover:bg-blue-400 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          } transition-colors`}
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

