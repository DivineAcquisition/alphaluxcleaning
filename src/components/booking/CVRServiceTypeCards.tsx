import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, LucideIcon, Home, Sparkles, Zap, Clock, Users, TrendingUp } from 'lucide-react';
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

interface CVRServiceTypeCardsProps {
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
        emoji: '🏠',
        timeEstimate: '2-3 hours',
        customerChoice: '87%',
        savings: 'Save $40/month'
      };
    case 'deep':
      return {
        bgClass: 'bg-service-deep',
        borderClass: 'border-service-deep-foreground/20',
        textClass: 'text-service-deep-foreground',
        iconBg: 'bg-service-deep-foreground/10',
        iconColor: 'text-service-deep-foreground',
        emoji: '⭐',
        timeEstimate: '4-6 hours',
        customerChoice: '78%',
        savings: 'Deep clean value'
      };
    case 'moveout':
      return {
        bgClass: 'bg-service-moveout',
        borderClass: 'border-service-moveout-foreground/20',
        textClass: 'text-service-moveout-foreground',
        iconBg: 'bg-service-moveout-foreground/10',
        iconColor: 'text-service-moveout-foreground',
        emoji: '📦',
        timeEstimate: '5-7 hours',
        customerChoice: '92%',
        savings: 'Get deposit back'
      };
    default:
      return {
        bgClass: 'bg-card',
        borderClass: 'border-border',
        textClass: 'text-foreground',
        iconBg: 'bg-muted',
        iconColor: 'text-muted-foreground',
        emoji: '🏠',
        timeEstimate: '2-3 hours',
        customerChoice: '85%',
        savings: 'Best value'
      };
  }
};

export function CVRServiceTypeCards({ 
  serviceTypes, 
  selectedType, 
  onSelect, 
  currentPrice = 0 
}: CVRServiceTypeCardsProps) {
  return (
    <Card className="border-primary/20 shadow-premium hover-lift">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-2xl">Choose Your Service</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Most popular services - instant booking</p>
            </div>
          </div>
          <Badge className="gradient-trust text-white px-4 py-2">
            <Users className="w-4 h-4 mr-2" />
            10,000+ Happy Customers
          </Badge>
        </div>
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
                  "cursor-pointer border-2 transition-all duration-300 relative overflow-hidden group",
                  isSelected
                    ? `${theme.bgClass} ${theme.borderClass} shadow-premium scale-105 animate-pulse-glow`
                    : `bg-card border-border hover:border-primary/40 hover:shadow-lg hover:scale-102 hover-lift`
                )}
                onClick={() => onSelect(service.id)}
              >
                {service.popular && (
                  <Badge className="absolute top-4 right-4 gradient-urgency text-white z-10 animate-bounce-subtle px-3 py-1">
                    🔥 Most Popular
                  </Badge>
                )}
                
                <CardHeader className="pb-4">
                  <div className="flex flex-col items-center text-center gap-4">
                    {/* Service Icon with Emoji */}
                    <div className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-all duration-300 shadow-md",
                      isSelected ? `${theme.iconBg} scale-110` : "bg-muted group-hover:scale-110"
                    )}>
                      {theme.emoji}
                    </div>
                    
                    <div>
                      <CardTitle className={cn(
                        "text-xl mb-2 font-bold",
                        isSelected ? theme.textClass : "text-foreground"
                      )}>
                        {service.name}
                      </CardTitle>
                      <p className={cn(
                        "text-sm font-medium mb-3",
                        isSelected ? theme.textClass : "text-muted-foreground"
                      )}>
                        {service.description}
                      </p>
                      
                      {/* Time Estimate & Customer Choice */}
                      <div className="flex gap-2 justify-center flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {theme.timeEstimate}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-success/5 text-success border-success/20">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {theme.customerChoice} choose this
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 flex flex-col h-full">
                  <div className="space-y-4 flex-grow">
                    {/* Dynamic Pricing Display with Savings */}
                    {currentPrice > 0 && isSelected && (
                      <div className="text-center p-4 rounded-lg gradient-premium animate-fade-in">
                        <div className="text-3xl font-bold text-white mb-1">
                          {formatPrice(currentPrice)}
                        </div>
                        <div className="text-xs text-white/90 font-medium mb-2">
                          Based on your selections
                        </div>
                        <Badge className="bg-white/20 text-white border-white/30">
                          💰 {theme.savings}
                        </Badge>
                      </div>
                    )}

                    {/* Features with enhanced checkmarks */}
                    <div className="space-y-3">
                      <h4 className={cn(
                        "font-semibold text-sm",
                        isSelected ? theme.textClass : "text-foreground"
                      )}>
                        ✨ What's included:
                      </h4>
                      <ul className="space-y-2">
                        {service.features.map((feature, index) => (
                          <li key={index} className={cn(
                            "flex items-start gap-2 text-sm transition-all duration-200",
                            isSelected ? theme.textClass : "text-muted-foreground"
                          )}>
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                            <span className="leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Enhanced Select Button */}
                  <div className="mt-6 space-y-3">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "w-full mobile-touch-target font-bold transition-all duration-300 text-base",
                        isSelected 
                          ? "gradient-premium text-white shadow-lg scale-105 animate-pulse" 
                          : "hover:bg-primary hover:text-primary-foreground hover:scale-105"
                      )}
                    >
                      {isSelected ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          ✓ Selected
                        </div>
                      ) : (
                        "Select This Service"
                      )}
                    </Button>
                    
                    {/* Service Type Badge */}
                    <div className="text-center">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          isSelected ? `${theme.borderClass} ${theme.textClass}` : ""
                        )}
                      >
                        {service.recurring ? "🔄 Recurring Available" : "⚡ One-Time Service"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-8 p-5 bg-gradient-to-r from-success/5 via-primary/5 to-accent/5 rounded-lg border border-success/20">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                💎 All prices include professional team, supplies & equipment
              </p>
              <p className="text-xs text-muted-foreground">
                * Final price based on home size, frequency & add-ons • 20% savings already applied • Pay after service complete
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
