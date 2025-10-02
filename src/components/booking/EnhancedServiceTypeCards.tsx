import React from 'react';
import { Card } from '@/components/ui/card';
import { FloatingServiceCard } from './FloatingServiceCard';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceFeature {
  text: string;
  included: boolean;
}

interface ServiceType {
  id: string;
  name: string;
  description: string;
  price?: number;
  icon: string;
  popular?: boolean;
  features: ServiceFeature[];
  recurring: boolean;
}

interface EnhancedServiceTypeCardsProps {
  serviceTypes: ServiceType[];
  selectedType: string;
  onSelect: (typeId: string) => void;
  currentPrice?: number;
}

export function EnhancedServiceTypeCards({ 
  serviceTypes, 
  selectedType, 
  onSelect, 
  currentPrice = 0 
}: EnhancedServiceTypeCardsProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
          Choose Your Service
        </h2>
        <p className="text-muted-foreground text-lg">
          Select the cleaning service that best fits your needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {serviceTypes.map((service) => (
          <FloatingServiceCard
            key={service.id}
            service={service}
            isSelected={selectedType === service.id}
            onSelect={() => onSelect(service.id)}
            currentPrice={currentPrice}
          />
        ))}
      </div>

      {/* Pricing Disclaimer */}
      <Card className="glass-card border-primary/20">
        <div className="p-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Final Pricing
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The final price will be determined after selecting your home size, cleaning frequency, 
              and any additional services. Our transparent pricing ensures you know exactly what you're paying for.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
