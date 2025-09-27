import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface FacebookPixelEventIndicatorProps {
  eventName: string;
  status: 'success' | 'pending' | 'error';
  value?: number;
  className?: string;
}

export function FacebookPixelEventIndicator({ 
  eventName, 
  status, 
  value, 
  className = '' 
}: FacebookPixelEventIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`flex items-center gap-1.5 px-2 py-1 ${getStatusColor()} ${className}`}
    >
      {getStatusIcon()}
      <span className="text-xs font-medium">
        FB: {eventName}
      </span>
      {value && (
        <span className="text-xs font-mono">
          ${value.toFixed(2)}
        </span>
      )}
    </Badge>
  );
}