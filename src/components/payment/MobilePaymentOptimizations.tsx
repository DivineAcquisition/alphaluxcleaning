import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Vibrate, Zap, Apple, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobilePaymentOptimizationsProps {
  onQuickPaySelect?: (method: 'apple_pay' | 'google_pay' | 'card') => void;
  isSupported?: {
    applePay: boolean;
    googlePay: boolean;
    webAuthn: boolean;
  };
  className?: string;
}

export function MobilePaymentOptimizations({ 
  onQuickPaySelect, 
  isSupported = { applePay: false, googlePay: false, webAuthn: false },
  className 
}: MobilePaymentOptimizationsProps) {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [hapticSupported, setHapticSupported] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
    setIsAndroid(/Android/.test(userAgent));
    
    // Check for haptic feedback support
    setHapticSupported('vibrate' in navigator);
  }, []);

  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (hapticSupported) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50]
      };
      navigator.vibrate(patterns[type]);
    }
  };

  const quickPayMethods = [
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      icon: Apple,
      available: isIOS && isSupported.applePay,
      primary: true,
      description: 'Touch ID / Face ID'
    },
    {
      id: 'google_pay',
      name: 'Google Pay',
      icon: CreditCard,
      available: isAndroid && isSupported.googlePay,
      primary: true,
      description: 'Fingerprint / PIN'
    },
    {
      id: 'card',
      name: 'Card',
      icon: CreditCard,
      available: true,
      primary: false,
      description: 'Credit / Debit'
    }
  ] as const;

  const availableMethods = quickPayMethods.filter(method => method.available);

  if (availableMethods.length === 0) return null;

  return (
    <Card className={cn("p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20", className)}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Quick Payment Options</span>
          <Badge variant="secondary" className="ml-auto">
            <Zap className="h-3 w-3 mr-1" />
            Fast
          </Badge>
        </div>

        <div className="grid gap-2">
          {availableMethods.map((method) => (
            <Button
              key={method.id}
              variant={method.primary ? "default" : "outline"}
              className={cn(
                "h-12 justify-start gap-3 relative overflow-hidden",
                method.primary && "bg-gradient-primary hover:opacity-90",
                "touch-manipulation" // Improves touch responsiveness
              )}
              onClick={() => {
                triggerHapticFeedback('light');
                onQuickPaySelect?.(method.id as any);
              }}
            >
              <method.icon className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">{method.name}</div>
                <div className="text-xs opacity-75">{method.description}</div>
              </div>
              
              {method.primary && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
              )}
            </Button>
          ))}
        </div>

        {/* Mobile optimization features */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Optimized for mobile</span>
          <div className="flex items-center gap-2">
            {isSupported.webAuthn && (
              <Badge variant="outline" className="text-xs">
                <Vibrate className="h-2 w-2 mr-1" />
                Biometric
              </Badge>
            )}
            {hapticSupported && (
              <Badge variant="outline" className="text-xs">
                Haptic Feedback
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Add shimmer animation to globals if not present
const shimmerKeyframes = `
@keyframes shimmer {
  0% { transform: translateX(-100%) skewX(-12deg); }
  100% { transform: translateX(200%) skewX(-12deg); }
}
`;