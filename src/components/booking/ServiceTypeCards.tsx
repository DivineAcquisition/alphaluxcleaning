import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, LucideIcon } from 'lucide-react';
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

interface ServiceTypeCardsProps {
  serviceTypes: ServiceType[];
  selectedType: string;
  onSelect: (typeId: string) => void;
}

export function ServiceTypeCards({ serviceTypes, selectedType, onSelect }: ServiceTypeCardsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Cleaning Service</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {serviceTypes.map((service) => {
            const IconComponent = service.icon;
            const isSelected = selectedType === service.id;
            
            return (
              <Card
                key={service.id}
                className={cn(
                  "cursor-pointer border-2 transition-all duration-200 hover:shadow-lg relative overflow-hidden",
                  isSelected
                    ? "border-primary bg-gradient-to-br from-primary/5 via-primary/5 to-accent/5"
                    : "border-border hover:border-primary/50 hover:bg-gradient-to-br hover:from-primary/5 hover:via-transparent hover:to-transparent"
                )}
                onClick={() => onSelect(service.id)}
              >
                {service.popular && (
                  <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground z-10">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-3 rounded-full transition-colors",
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg mb-1">{service.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Starting Price */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(service.basePrice)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        starting price*
                      </span>
                    </div>

                    {/* Features */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-foreground">What's included:</h4>
                      <ul className="space-y-1">
                        {service.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Service Type Badge */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      {service.recurring ? (
                        <Badge variant="outline" className="text-xs">
                          Recurring Available
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          One-Time Only
                        </Badge>
                      )}
                    </div>
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