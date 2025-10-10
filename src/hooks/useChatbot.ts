import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChatMessage, 
  BookingContext, 
  saveChatHistory, 
  loadChatHistory, 
  clearChatHistory as clearHistoryUtil,
  generateMessageId 
} from '@/lib/chat-utils';

const CHAT_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-booking-assistant`;

export interface UseChatbotReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  unreadCount: number;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  toggleChat: () => void;
  clearChat: () => void;
  markAsRead: () => void;
}

export function useChatbot(bookingContext?: BookingContext): UseChatbotReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  // Load chat history on mount
  useEffect(() => {
    const history = loadChatHistory();
    if (history.length > 0) {
      setMessages(history);
      // Count unread assistant messages
      const unread = history.filter(m => m.role === 'assistant').length;
      setUnreadCount(unread);
    } else {
      // Add welcome message
      const welcomeMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: "Hi! I'm here to help you with your booking. Feel free to ask me anything about our services, pricing, or the booking process! 😊",
        timestamp: new Date()
      };
      setMessages([welcomeMsg]);
      saveChatHistory([welcomeMsg]);
    }
    isFirstLoad.current = false;
  }, []);

  // Save messages to session storage whenever they change
  useEffect(() => {
    if (!isFirstLoad.current && messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          bookingContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Create assistant message placeholder
      const assistantMsgId = generateMessageId();
      let assistantContent = '';

      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (let line of lines) {
          line = line.trim();
          if (!line || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => prev.map(m => 
                m.id === assistantMsgId 
                  ? { ...m, content: assistantContent }
                  : m
              ));
            }
          } catch (e) {
            // Ignore JSON parse errors for incomplete chunks
          }
        }
      }

      // Increment unread count if chat is closed
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }

    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      
      // Add error message
      const errorMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, bookingContext, isLoading, isOpen]);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) {
        // Opening chat - mark all as read
        setUnreadCount(0);
      }
      return !prev;
    });
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    clearHistoryUtil();
    setUnreadCount(0);
    // Add welcome message after clearing
    const welcomeMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: "Chat cleared! How can I help you with your booking?",
      timestamp: new Date()
    };
    setMessages([welcomeMsg]);
  }, []);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    messages,
    isLoading,
    isOpen,
    unreadCount,
    error,
    sendMessage,
    toggleChat,
    clearChat,
    markAsRead
  };
}
