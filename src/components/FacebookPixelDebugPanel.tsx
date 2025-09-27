import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Eye, EyeOff } from 'lucide-react';

interface PixelEvent {
  eventName: string;
  parameters: any;
  timestamp: Date;
  status: 'success' | 'pending' | 'error';
  value?: number;
}

interface FacebookPixelDebugPanelProps {
  events: PixelEvent[];
  onClear: () => void;
}

export function FacebookPixelDebugPanel({ events, onClear }: FacebookPixelDebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Only show in development
  useEffect(() => {
    setIsVisible(import.meta.env.DEV);
  }, []);

  if (!isVisible) return null;

  const getEventColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500/20 text-green-700 border-green-500/50';
      case 'pending': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50';
      case 'error': return 'bg-red-500/20 text-red-700 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-500/50';
    }
  };

  const totalValue = events.reduce((sum, event) => sum + (event.value || 0), 0);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              🎯 FB Pixel Debug
              <Badge variant="outline" className="text-xs">
                {events.length} events
              </Badge>
              {totalValue > 0 && (
                <Badge variant="default" className="text-xs">
                  ${totalValue.toFixed(2)}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="pt-0">
            <div className="space-y-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                className="w-full text-xs"
              >
                Clear Events
              </Button>
            </div>
            
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {events.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No pixel events tracked yet
                  </p>
                ) : (
                  events.map((event, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-md border text-xs ${getEventColor(event.status)}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{event.eventName}</span>
                        <span className="text-xs opacity-75">
                          {event.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      {event.value && (
                        <div className="text-xs font-mono mb-1">
                          Value: ${event.value.toFixed(2)}
                        </div>
                      )}
                      <div className="text-xs opacity-75 font-mono">
                        {JSON.stringify(event.parameters, null, 1)
                          .replace(/[\{\}]/g, '')
                          .split('\n')
                          .filter(line => line.trim())
                          .slice(0, 3)
                          .join(', ')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>
    </div>
  );
}