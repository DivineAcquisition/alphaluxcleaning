import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, CreditCard, Globe, Smartphone, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentSecurityIndicatorProps {
  isWebAuthnSupported?: boolean;
  deviceType?: 'mobile' | 'desktop';
  paymentMethod?: string;
  className?: string;
}

export function PaymentSecurityIndicator({ 
  isWebAuthnSupported = false, 
  deviceType = 'desktop',
  paymentMethod,
  className 
}: PaymentSecurityIndicatorProps) {
  const securityFeatures = [
    {
      icon: Shield,
      label: 'PCI DSS Compliant',
      description: 'Highest security standards',
      priority: 'high'
    },
    {
      icon: Lock,
      label: '256-bit SSL',
      description: 'Bank-grade encryption',
      priority: 'high'
    },
    {
      icon: Globe,
      label: 'Global Security',
      description: 'Worldwide fraud protection',
      priority: 'medium'
    },
    {
      icon: CreditCard,
      label: 'Secure Processing',
      description: 'Stripe verified',
      priority: 'medium'
    }
  ];

  const mobileFeatures = [
    {
      icon: Smartphone,
      label: 'Touch/Face ID',
      description: 'Biometric authentication',
      available: isWebAuthnSupported
    },
    {
      icon: CheckCircle,
      label: 'Mobile Optimized',
      description: 'Responsive & secure',
      available: true
    }
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Primary security badges */}
      <div className="flex flex-wrap items-center gap-2">
        {securityFeatures
          .filter(feature => feature.priority === 'high')
          .map((feature) => (
            <Badge 
              key={feature.label}
              variant="secondary" 
              className="flex items-center gap-1 bg-success/10 text-success border-success/20"
            >
              <feature.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{feature.label}</span>
              <span className="sm:hidden">{feature.label.split(' ')[0]}</span>
            </Badge>
          ))}
        
        {paymentMethod && (
          <Badge variant="outline" className="capitalize font-medium">
            {paymentMethod}
          </Badge>
        )}
      </div>

      {/* Mobile-specific features */}
      {deviceType === 'mobile' && (
        <div className="flex flex-wrap items-center gap-2">
          {mobileFeatures
            .filter(feature => feature.available)
            .map((feature) => (
              <Badge 
                key={feature.label}
                variant="secondary" 
                className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20"
              >
                <feature.icon className="h-3 w-3" />
                <span className="text-xs">{feature.label}</span>
              </Badge>
            ))}
        </div>
      )}

      {/* Detailed security grid for desktop */}
      {deviceType === 'desktop' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {securityFeatures.map((feature) => (
            <div 
              key={feature.label}
              className="flex flex-col items-center text-center p-2 rounded-lg bg-muted/30"
            >
              <feature.icon className="h-4 w-4 text-success mb-1" />
              <span className="font-medium text-foreground">{feature.label}</span>
              <span className="text-muted-foreground">{feature.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Trust indicators */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>Secured by Stripe • Trusted by millions</span>
        </div>
      </div>
    </div>
  );
}