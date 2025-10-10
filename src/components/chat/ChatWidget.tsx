import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Minus, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useChatbot } from '@/hooks/useChatbot';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatTypingIndicator } from './ChatTypingIndicator';
import type { BookingContext } from '@/lib/chat-utils';

interface ChatWidgetProps {
  bookingContext?: BookingContext;
}

export function ChatWidget({ bookingContext }: ChatWidgetProps) {
  const {
    messages,
    isLoading,
    isOpen,
    unreadCount,
    error,
    sendMessage,
    toggleChat,
    clearChat,
    markAsRead
  } = useChatbot(bookingContext);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // ESC key handler for fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Detect booking creation in messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage.content.includes('Booking created successfully')) {
      setBookingInProgress(false);
    } else if (lastMessage?.role === 'assistant' && lastMessage.content.toLowerCase().includes('creating your booking')) {
      setBookingInProgress(true);
    }
  }, [messages]);

  // Mark as read when opened
  useEffect(() => {
    if (isOpen) {
      markAsRead();
    }
  }, [isOpen, markAsRead]);

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={toggleChat}
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 transition-transform hover:scale-110",
          unreadCount > 0 && !isOpen && "animate-pulse"
        )}
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Chat Panel */}
      {isOpen && (
        <div className={cn(
          "fixed z-50 bg-background flex flex-col animate-scale-in transition-all duration-300",
          isFullscreen 
            ? "inset-0 rounded-none" 
            : cn(
                "bottom-24 right-6 w-[400px] h-[600px] border rounded-lg shadow-2xl",
                "max-md:bottom-0 max-md:right-0 max-md:left-0 max-md:w-full max-md:h-[100vh] max-md:rounded-none"
              )
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-card">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-sm">Alpha Lux Assistant</h3>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-8 w-8"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                className="h-8 w-8"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className="h-8 w-8 md:hidden"
                title="Minimize"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className="h-8 w-8"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages - centered in fullscreen */}
          <div 
            ref={messageContainerRef}
            className={cn(
              "flex-1 overflow-y-auto p-4 space-y-4 bg-background",
              isFullscreen && "max-w-3xl mx-auto w-full py-8"
            )}
          >
            {bookingInProgress && (
              <div className="bg-primary/10 p-3 rounded-lg mb-2">
                <div className="flex items-center gap-2">
                  <div className="animate-spin">⏳</div>
                  <span className="text-sm font-medium">Creating your booking...</span>
                </div>
              </div>
            )}
            
            {bookingContext && (
              <div className="bg-muted p-3 rounded-lg mb-2">
                <p className="text-xs font-semibold mb-2">Current Booking Info:</p>
                <div className="text-xs space-y-1">
                  {bookingContext.stateCode && <div>📍 State: {bookingContext.stateCode}</div>}
                  {bookingContext.zipCode && <div>🏠 ZIP: {bookingContext.zipCode}</div>}
                  {bookingContext.serviceType && <div>🧹 Service: {bookingContext.serviceType}</div>}
                  {bookingContext.homeSize && <div>📐 Size: {bookingContext.homeSize}</div>}
                  {bookingContext.frequency && <div>📅 Frequency: {bookingContext.frequency}</div>}
                  {bookingContext.estimatedPrice && <div>💰 Price: ${bookingContext.estimatedPrice}</div>}
                </div>
              </div>
            )}
            
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
                onInteraction={sendMessage}
              />
            ))}
            {isLoading && <ChatTypingIndicator />}
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - centered in fullscreen */}
          <div className={cn(
            "border-t",
            isFullscreen && "max-w-3xl mx-auto w-full"
          )}>
            <ChatInput
              onSend={sendMessage}
              disabled={isLoading}
              placeholder="Ask me anything..."
            />
          </div>
        </div>
      )}
    </>
  );
}
