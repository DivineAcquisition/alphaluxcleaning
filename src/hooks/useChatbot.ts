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
  collectedData: {
    serviceType: string;
    homeSize: string;
    frequency: string;
    stateCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    streetAddress: string;
    city: string;
    zipCode: string;
    preferredDate: string;
    preferredTime: string;
    addOns: string[];
  };
}

export function useChatbot(bookingContext?: BookingContext): UseChatbotReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isFirstLoad = useRef(true);
  
  // Track collected data for sequential flow
  const [collectedData, setCollectedData] = useState({
    serviceType: '',
    homeSize: '',
    frequency: '',
    stateCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    streetAddress: '',
    city: '',
    zipCode: '',
    preferredDate: '',
    preferredTime: '',
    addOns: [] as string[],
  });

  // Helper to get last non-empty assistant content
  const getLastNonEmptyAssistantContent = (msgs: ChatMessage[]): string => {
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (m.role === 'assistant' && m.content && m.content.trim()) {
        return m.content;
      }
    }
    return '';
  };

  // Helper to extract question text from INTERACTIVE blocks
  const extractQuestionText = (aiMessage: string): string => {
    try {
      const interactiveIndex = aiMessage.indexOf('INTERACTIVE:');
      if (interactiveIndex !== -1) {
        const jsonStart = interactiveIndex + 'INTERACTIVE:'.length;
        const jsonStr = aiMessage.slice(jsonStart).trim();
        const parsed = JSON.parse(jsonStr);
        return parsed.question || parsed.content || aiMessage;
      }
      return aiMessage;
    } catch {
      return aiMessage;
    }
  };

  // Extract data from user messages based on context
  const extractDataFromMessage = useCallback((userMessage: string, lastAIMessage: string): { field: keyof typeof collectedData; value: string } | null => {
    const lowerMsg = userMessage.toLowerCase();
    const questionText = extractQuestionText(lastAIMessage);
    const lowerAI = questionText.toLowerCase();

    // Email detection
    if (lowerAI.includes('email')) {
      const emailMatch = userMessage.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) return { field: 'email', value: emailMatch[0] };
    }

    // Phone detection
    if (lowerAI.includes('phone')) {
      const phoneMatch = userMessage.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch) return { field: 'phone', value: phoneMatch[0].replace(/\D/g, '') };
    }

    // Name detection (first name)
    if (lowerAI.includes('first name')) {
      const nameMatch = userMessage.match(/^([A-Za-z]+)$/);
      if (nameMatch) return { field: 'firstName', value: nameMatch[1] };
    }

    // Last name detection
    if (lowerAI.includes('last name')) {
      const nameMatch = userMessage.match(/^([A-Za-z]+)$/);
      if (nameMatch) return { field: 'lastName', value: nameMatch[1] };
    }

    // Address detection
    if (lowerAI.includes('street') || lowerAI.includes('address')) {
      return { field: 'streetAddress', value: userMessage };
    }

    // City detection
    if (lowerAI.includes('city')) {
      return { field: 'city', value: userMessage };
    }

    // ZIP code detection
    if (lowerAI.includes('zip')) {
      const zipMatch = userMessage.match(/\d{5}/);
      if (zipMatch) return { field: 'zipCode', value: zipMatch[0] };
    }

    // State code detection (before time to avoid conflicts)
    if (lowerAI.includes('state') || lowerAI.includes('located in')) {
      const stateMatch = userMessage.match(/\b([A-Z]{2})\b/);
      if (stateMatch) return { field: 'stateCode', value: stateMatch[1] };
      
      // Handle lowercase or mixed case
      const stateLower = userMessage.trim().toUpperCase();
      if (/^[A-Z]{2}$/.test(stateLower)) {
        return { field: 'stateCode', value: stateLower };
      }
    }

    // Date detection
    if (lowerAI.includes('date') || lowerAI.includes('when')) {
      return { field: 'preferredDate', value: userMessage };
    }

    // Time detection (after state to avoid conflicts)
    if (lowerAI.includes('time')) {
      return { field: 'preferredTime', value: userMessage };
    }

    return null;
  }, []);

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
        content: "Hi, how can I help with your booking?",
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
    
    // Extract data from user message if possible using last non-empty assistant content
    const lastAssistantContent = getLastNonEmptyAssistantContent(messages);
    const extracted = lastAssistantContent 
      ? extractDataFromMessage(content.trim(), lastAssistantContent)
      : null;
    
    // Create updated collectedData before the fetch
    const nextCollected = extracted
      ? { ...collectedData, [extracted.field]: extracted.value }
      : collectedData;
    
    if (extracted) {
      console.log('📝 Extracted field:', extracted.field, '=', extracted.value);
      setCollectedData(nextCollected);
    }

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
          bookingContext: {
            ...bookingContext,
            collectedData: nextCollected
          }
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

      // Handle empty assistant replies
      if (!assistantContent.trim()) {
        assistantContent = "I didn't get a response there. Please try again.";
        setMessages(prev => prev.map(m => 
          m.id === assistantMsgId 
            ? { ...m, content: assistantContent }
            : m
        ));
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
  }, [messages, bookingContext, isLoading, isOpen, collectedData, extractDataFromMessage]);

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
    markAsRead,
    collectedData
  };
}
