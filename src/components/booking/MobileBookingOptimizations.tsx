import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Mobile-optimized time slot picker
interface MobileTimeSlotPickerProps {
  timeSlots: Array<{
    value: string;
    label: string;
    range: string;
    popular?: boolean;
  }>;
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
}

export function MobileTimeSlotPicker({ timeSlots, selectedTime, onTimeSelect }: MobileTimeSlotPickerProps) {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const selectedSlot = timeSlots.find(slot => slot.value === selectedTime);

  if (!isMobile) {
    // Desktop grid layout
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {timeSlots.map((slot) => {
          const isSelected = selectedTime === slot.value;
          
          return (
            <button
              key={slot.value}
              onClick={() => onTimeSelect(slot.value)}
              className={cn(
                "relative p-4 rounded-lg border text-left transition-all duration-200 hover:shadow-md touch-manipulation",
                isSelected 
                  ? "border-primary bg-primary/5 shadow-clean"
                  : "border-border hover:border-primary/50"
              )}
            >
              {slot.popular && (
                <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs">
                  Popular
                </Badge>
              )}
              <div className="font-medium">{slot.label}</div>
              <div className="text-sm text-muted-foreground">{slot.range}</div>
            </button>
          );
        })}
      </div>
    );
  }

  // Mobile accordion-style layout
  return (
    <div className="space-y-3">
      {/* Selected time display */}
      <Card className={cn(
        "border-2 transition-colors cursor-pointer touch-manipulation",
        selectedTime ? "border-primary bg-primary/5" : "border-border"
      )}>
        <CardContent 
          className="p-4"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div>
              {selectedSlot ? (
                <>
                  <div className="font-medium">{selectedSlot.label}</div>
                  <div className="text-sm text-muted-foreground">{selectedSlot.range}</div>
                  {selectedSlot.popular && (
                    <Badge className="mt-1 bg-accent text-accent-foreground text-xs">
                      Popular
                    </Badge>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground">Select a time slot</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedTime && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expandable time slots */}
      {isExpanded && (
        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
          {timeSlots.map((slot) => {
            const isSelected = selectedTime === slot.value;
            
            return (
              <Card
                key={slot.value}
                className={cn(
                  "border transition-all duration-200 cursor-pointer touch-manipulation",
                  isSelected 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/30"
                )}
              >
                <CardContent 
                  className="p-4"
                  onClick={() => {
                    onTimeSelect(slot.value);
                    setIsExpanded(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{slot.label}</div>
                      <div className="text-sm text-muted-foreground">{slot.range}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {slot.popular && (
                        <Badge className="bg-accent text-accent-foreground text-xs">
                          Popular
                        </Badge>
                      )}
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Mobile-optimized sticky bottom navigation
interface MobileBottomNavProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
  className?: string;
}

export function MobileBottomNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  backLabel = "Back",
  nextDisabled = false,
  showBack = true,
  className
}: MobileBottomNavProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <div className={cn("flex flex-col sm:flex-row gap-4 justify-between", className)}>
        {showBack && onBack && (
          <Button 
            variant="outline"
            onClick={onBack}
            size="lg"
            className="touch-manipulation"
          >
            {backLabel}
          </Button>
        )}
        {onNext && (
          <Button 
            onClick={onNext}
            disabled={nextDisabled}
            size="lg"
            className="touch-manipulation"
          >
            {nextLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50 safe-area-pb">
      <div className="flex gap-3 max-w-sm mx-auto">
        {showBack && onBack && (
          <Button 
            variant="outline"
            onClick={onBack}
            size="lg"
            className="flex-1 touch-manipulation min-h-[48px]"
          >
            {backLabel}
          </Button>
        )}
        {onNext && (
          <Button 
            onClick={onNext}
            disabled={nextDisabled}
            size="lg"
            className={cn(
              "touch-manipulation min-h-[48px]",
              showBack && onBack ? "flex-2" : "flex-1"
            )}
          >
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

// Mobile-friendly form input with better touch targets
interface MobileFormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  help?: string;
}

export function MobileFormField({ label, children, required, error, help }: MobileFormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          className: cn(
            "min-h-[48px] touch-manipulation", // Ensure 48px minimum for touch targets
            (children as React.ReactElement).props.className
          )
        })}
      </div>
      {help && (
        <p className="text-xs text-muted-foreground">{help}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

// Mobile-optimized service selection cards
interface MobileServiceCardProps {
  title: string;
  description?: string;
  price?: string;
  badge?: string;
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function MobileServiceCard({
  title,
  description,
  price,
  badge,
  isSelected,
  onSelect,
  className
}: MobileServiceCardProps) {
  const isMobile = useIsMobile();

  return (
    <Card
      className={cn(
        "transition-all duration-200 cursor-pointer touch-manipulation",
        isSelected 
          ? "border-primary bg-primary/5 shadow-clean" 
          : "border-border hover:border-primary/50 hover:shadow-md",
        isMobile && "active:scale-[0.98]", // Touch feedback
        className
      )}
      onClick={onSelect}
    >
      <CardContent className={cn("p-4", isMobile && "p-6")}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn("font-semibold", isMobile && "text-lg")}>{title}</h3>
              {badge && (
                <Badge className="text-xs bg-accent text-accent-foreground">
                  {badge}
                </Badge>
              )}
            </div>
            {description && (
              <p className={cn("text-muted-foreground", isMobile ? "text-base" : "text-sm")}>
                {description}
              </p>
            )}
            {price && (
              <div className={cn("font-bold text-primary mt-2", isMobile && "text-xl")}>
                {price}
              </div>
            )}
          </div>
          {isSelected && (
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center ml-4">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}