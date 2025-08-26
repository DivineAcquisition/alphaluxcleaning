import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, MessageSquare, AlertCircle } from 'lucide-react';

interface ChatFallbackProps {
  className?: string;
}

export const ChatFallback: React.FC<ChatFallbackProps> = ({ className = "" }) => {
  const [chatAvailable, setChatAvailable] = useState(true);
  const [hasAttemptedChat, setHasAttemptedChat] = useState(false);

  useEffect(() => {
    // Check if chat widget is available
    const checkChatWidget = () => {
      // Common chat widget checks
      const hasIntercom = typeof window !== 'undefined' && (window as any).Intercom;
      const hasZendesk = typeof window !== 'undefined' && (window as any).zE;
      const hasCrisp = typeof window !== 'undefined' && (window as any).$crisp;
      const hasLiveChat = typeof window !== 'undefined' && (window as any).LC_API;
      
      return hasIntercom || hasZendesk || hasCrisp || hasLiveChat;
    };

    // Initial check
    if (!checkChatWidget()) {
      setChatAvailable(false);
    }

    // Periodic check for chat widget loading
    const checkInterval = setInterval(() => {
      if (!checkChatWidget() && hasAttemptedChat) {
        setChatAvailable(false);
      }
    }, 2000);

    return () => clearInterval(checkInterval);
  }, [hasAttemptedChat]);

  const handleChatAttempt = () => {
    setHasAttemptedChat(true);
    
    // Try to open chat widgets
    try {
      if ((window as any).Intercom) {
        (window as any).Intercom('show');
        return;
      }
      if ((window as any).zE) {
        (window as any).zE('webWidget', 'open');
        return;
      }
      if ((window as any).$crisp) {
        (window as any).$crisp.push(['do', 'chat:open']);
        return;
      }
      if ((window as any).LC_API) {
        (window as any).LC_API.open_chat_window();
        return;
      }
      
      // If no chat widget found, fallback to phone
      setChatAvailable(false);
    } catch (error) {
      console.error('Chat widget failed to open:', error);
      setChatAvailable(false);
    }
  };

  const handlePhoneCall = () => {
    window.open('tel:2818099901', '_self');
  };

  if (!chatAvailable) {
    return (
      <Card className={`border-orange-200 bg-orange-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-orange-800 font-medium">Chat Currently Unavailable</p>
              <p className="text-xs text-orange-700 mt-1">Please call us directly for immediate assistance</p>
            </div>
            <Button 
              onClick={handlePhoneCall}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        onClick={handleChatAttempt}
        variant="outline"
        className="flex-1"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Chat with Support
      </Button>
      <Button
        onClick={handlePhoneCall}
        variant="outline"
        className="flex-1"
      >
        <Phone className="h-4 w-4 mr-2" />
        Call: (281) 809-9901
      </Button>
    </div>
  );
};