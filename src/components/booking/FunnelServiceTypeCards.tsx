import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, LucideIcon, Star, TrendingUp, Clock } from 'lucide-react';
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

interface FunnelServiceTypeCardsProps {
  serviceTypes: ServiceType[];
  selectedType: string;
  onSelect: (typeId: string) => void;
}

export function FunnelServiceTypeCards({ serviceTypes, selectedType, onSelect }: FunnelServiceTypeCardsProps) {
  return (
    <Card className="funnel-card">
      <CardHeader>
        <div className="text-center space-y-2">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            Step 1 of 4
          </Badge>
          <CardTitle className="text-2xl md:text-3xl">Choose Your Perfect Cleaning Service</CardTitle>
          <p className="text-muted-foreground">Select the service that fits your needs best</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceTypes.map((service) => {
            const IconComponent = service.icon;
            const isSelected = selectedType === service.id;
            
            return (
              <Card
                key={service.id}
                className={cn(
                  "cursor-pointer border-2 transition-all duration-300 relative overflow-hidden group",
                  "hover:shadow-funnel-hover",
                  isSelected
                    ? "border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 shadow-funnel-active"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => onSelect(service.id)}
              >
                {/* Gradient Overlay */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300",
                  !isSelected && "group-hover:opacity-100"
                )} />
                
                {service.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-br from-funnel-premium to-funnel-urgency text-white px-4 py-1 text-xs font-bold flex items-center gap-1 rounded-bl-lg">
                    <Star className="h-3 w-3 fill-current" />
                    MOST POPULAR
                  </div>
                )}
                
                <CardHeader className="pb-4 relative">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={cn(
                      "p-4 rounded-full transition-all duration-300",
                      isSelected 
                        ? "bg-primary text-primary-foreground scale-110" 
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-xl flex items-center justify-center gap-2">
                        {service.name}
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-primary animate-scale-in" />
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-4">
                  {/* Pricing with Emphasis */}
                  <div className="text-center py-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs text-muted-foreground line-through">
                        ${(service.basePrice / 0.8).toFixed(0)}
                      </span>
                      <Badge variant="destructive" className="text-xs">20% OFF</Badge>
                    </div>
                    <div className="flex items-baseline justify-center gap-1 mt-1">
                      <span className="text-3xl font-bold text-primary">
                        {formatPrice(service.basePrice)}
                      </span>
                      <span className="text-sm text-muted-foreground">starting</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      What's included:
                    </h4>
                    <ul className="space-y-1.5">
                      {service.features.slice(0, 4).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-3.5 w-3.5 text-funnel-success mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Social Proof & Details */}
                  <div className="pt-3 border-t border-border/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>2-4 hours</span>
                      </div>
                      {service.recurring && (
                        <Badge variant="outline" className="text-xs bg-funnel-success-light text-funnel-success border-funnel-success/20">
                          Save More with Recurring
                        </Badge>
                      )}
                    </div>
                    {service.popular && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <TrendingUp className="h-3 w-3" />
                        <span className="font-medium">87% of customers choose this</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Trust Footer */}
        <div className="mt-8 p-6 bg-gradient-to-br from-funnel-success-light to-transparent border border-funnel-success/20 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-funnel-success flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">100% Satisfaction Guarantee</h4>
              <p className="text-sm text-muted-foreground">
                Final price depends on home size and frequency. All prices include professional team, equipment, and supplies. Pay only after service completion.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
