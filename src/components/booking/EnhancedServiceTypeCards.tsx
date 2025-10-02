import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, LucideIcon, Home, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/pricing-utils';

interface ServiceType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  icon: LucideIcon;
  popular: boolean;
  features: string[];
  recurring: boolean;
}

interface EnhancedServiceTypeCardsProps {
  serviceTypes: ServiceType[];
  selectedType: string;
  onSelect: (typeId: string) => void;
  currentPrice?: number;
}

const getServiceTheme = (serviceId: string) => {
  switch (serviceId) {
    case 'regular':
      return {
        bgClass: 'bg-service-regular',
        borderClass: 'border-service-regular-foreground/20',
        textClass: 'text-service-regular-foreground',
        iconBg: 'bg-service-regular-foreground/10',
        iconColor: 'text-service-regular-foreground',
        icon: Home
      };
    case 'deep':
      return {
        bgClass: 'bg-service-deep',
        borderClass: 'border-service-deep-foreground/20',
        textClass: 'text-service-deep-foreground',
        iconBg: 'bg-service-deep-foreground/10',
        iconColor: 'text-service-deep-foreground',
        icon: Sparkles
      };
    case 'moveout':
      return {
        bgClass: 'bg-service-moveout',
        borderClass: 'border-service-moveout-foreground/20',
        textClass: 'text-service-moveout-foreground',
        iconBg: 'bg-service-moveout-foreground/10',
        iconColor: 'text-service-moveout-foreground',
        icon: Zap
      };
    default:
      return {
        bgClass: 'bg-card',
        borderClass: 'border-border',
        textClass: 'text-foreground',
        iconBg: 'bg-muted',
        iconColor: 'text-muted-foreground',
        icon: Home
      };
  }
};

export function EnhancedServiceTypeCards({ 
  serviceTypes, 
  selectedType, 
  onSelect, 
  currentPrice = 0 
}: EnhancedServiceTypeCardsProps) {
  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          Choose Your Cleaning Service
        </CardTitle>
        <p className="text-muted-foreground mt-2">Select the perfect cleaning service for your needs</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {serviceTypes.map((service) => {
            const theme = getServiceTheme(service.id);
            const isSelected = selectedType === service.id;
            
            return (
              <Card
                key={service.id}
                className={cn(
                  "cursor-pointer border-2 transition-all duration-300 hover:shadow-xl relative overflow-hidden min-h-[200px] mobile-touch-target",
                  isSelected
                    ? `${theme.bgClass} ${theme.borderClass} shadow-lg scale-105`
                    : `bg-card border-border hover:border-primary/30 hover:shadow-lg hover:scale-102`
                )}
                onClick={() => onSelect(service.id)}
              >
                {service.popular && (
                  <Badge className="absolute top-4 right-4 bg-success text-success-foreground z-10 animate-pulse">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="pb-4">
                  <div className="flex flex-col items-center text-center gap-4">
                    {/* Service Icon */}
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-md",
                      isSelected ? theme.iconBg : "bg-muted"
                    )}>
                      <theme.icon className={cn("w-8 h-8", isSelected ? theme.iconColor : "text-muted-foreground")} />
                    </div>
                    
                    <div>
                      <CardTitle className={cn(
                        "text-xl mb-2 font-bold",
                        isSelected ? theme.textClass : "text-foreground"
                      )}>
                        {service.name}
                      </CardTitle>
                      <p className={cn(
                        "text-sm font-medium",
                        isSelected ? theme.textClass : "text-muted-foreground"
                      )}>
                        {service.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 flex flex-col h-full">
                  <div className="space-y-4 flex-grow">
                    {/* Dynamic Pricing Display */}
                    {currentPrice > 0 && isSelected && (
                      <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-2xl font-bold text-primary">
                          Starting at {formatPrice(currentPrice)}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Based on your selections
                        </p>
                      </div>
                    )}

                    {/* Features */}
                    <div className="space-y-2">
                      <h4 className={cn(
                        "font-semibold text-sm",
                        isSelected ? theme.textClass : "text-foreground"
                      )}>
                        What's included:
                      </h4>
                      <ul className="space-y-1">
                        {service.features.map((feature, index) => (
                          <li key={index} className={cn(
                            "flex items-start gap-2 text-sm",
                            isSelected ? theme.textClass : "text-muted-foreground"
                          )}>
                            <CheckCircle className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Select Button */}
                  <div className="mt-6">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "w-full mobile-touch-target font-semibold transition-all duration-200",
                        isSelected 
                          ? "bg-primary text-primary-foreground shadow-lg" 
                          : "hover:bg-primary hover:text-primary-foreground"
                      )}
                    >
                      {isSelected ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Selected
                        </div>
                      ) : (
                        "Select Service"
                      )}
                    </Button>
                  </div>

                  {/* Service Type Badge */}
                  <div className="mt-3 text-center">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        isSelected ? `${theme.borderClass} ${theme.textClass}` : ""
                      )}
                    >
                      {service.recurring ? "Recurring Available" : "One-Time Only"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            * Final price depends on home size, frequency, and selected add-ons. 
            All prices include equipment, supplies, and professional cleaning team.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}