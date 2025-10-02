import React from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
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

interface FloatingServiceCardProps {
  service: ServiceType;
  isSelected: boolean;
  onSelect: () => void;
  currentPrice?: number;
  variant?: 'default' | 'gradient-blue' | 'gradient-coral' | 'gradient-mint' | 'gradient-purple';
}

const serviceThemeMap: Record<string, 'default' | 'gradient-blue' | 'gradient-coral' | 'gradient-mint' | 'gradient-purple'> = {
  'regular_cleaning': 'gradient-blue',
  'deep_cleaning': 'gradient-coral',
  'move_out_cleaning': 'gradient-mint',
};

export function FloatingServiceCard({
  service,
  isSelected,
  onSelect,
  currentPrice,
  variant = 'default'
}: FloatingServiceCardProps) {
  const autoVariant = variant === 'default' ? serviceThemeMap[service.id] || 'gradient-blue' : variant;
  
  return (
    <GlassCard
      variant={isSelected ? autoVariant : 'default'}
      className={cn(
        "cursor-pointer transition-all duration-300 hover:-translate-y-2 relative overflow-hidden group",
        isSelected ? "ring-4 ring-primary/50 shadow-2xl scale-105" : "hover:shadow-xl"
      )}
      onClick={onSelect}
    >
      {service.popular && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-yellow-400 text-yellow-900 border-none shadow-lg animate-float">
            <Sparkles className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      
      {isSelected && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-white/90 dark:bg-black/90 rounded-full p-2 shadow-lg">
            <Check className="h-5 w-5 text-green-600" />
          </div>
        </div>
      )}

      <GlassCardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            "text-4xl p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110",
            isSelected ? "bg-white/20" : "bg-primary/10"
          )}>
            {service.icon}
          </div>
          <div className="flex-1">
            <GlassCardTitle className={cn(
              "text-xl mb-1",
              isSelected ? "text-white" : "text-foreground"
            )}>
              {service.name}
            </GlassCardTitle>
            {currentPrice && currentPrice > 0 && isSelected && (
              <p className="text-2xl font-bold text-white">
                ${currentPrice}
              </p>
            )}
          </div>
        </div>
      </GlassCardHeader>

      <GlassCardContent className="space-y-4">
        <p className={cn(
          "text-sm leading-relaxed",
          isSelected ? "text-white/90" : "text-muted-foreground"
        )}>
          {service.description}
        </p>

        <div className="space-y-2">
          {service.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className={cn(
                "h-4 w-4 mt-0.5 flex-shrink-0",
                isSelected ? "text-white" : "text-green-600"
              )} />
              <span className={cn(
                "text-sm",
                isSelected ? "text-white/80" : "text-foreground"
              )}>
                {feature.text}
              </span>
            </div>
          ))}
        </div>

        <GradientButton
          variant={isSelected ? "glass" : "gradient"}
          className="w-full mt-4"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {isSelected ? (
            <>
              <Check className="h-4 w-4" />
              Selected
            </>
          ) : (
            'Select Service'
          )}
        </GradientButton>
      </GlassCardContent>
      
      {!isSelected && (
        <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </GlassCard>
  );
}
