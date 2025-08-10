import React from 'react';
import { CheckCircle, AlertCircle, Clock, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ValidationRule {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'valid' | 'invalid' | 'checking';
  required: boolean;
}

interface PaymentFormValidationProps {
  validationRules: ValidationRule[];
  cardBrand?: string;
  showStrength?: boolean;
  className?: string;
}

export function PaymentFormValidation({ 
  validationRules, 
  cardBrand,
  showStrength = true,
  className 
}: PaymentFormValidationProps) {
  const getValidationIcon = (status: ValidationRule['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'checking':
        return <Clock className="h-4 w-4 text-warning animate-pulse" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted" />;
    }
  };

  const validCount = validationRules.filter(rule => rule.status === 'valid').length;
  const totalRequired = validationRules.filter(rule => rule.required).length;
  const validationStrength = totalRequired > 0 ? (validCount / totalRequired) * 100 : 0;

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-success';
    if (strength >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getStrengthLabel = (strength: number) => {
    if (strength >= 80) return 'Strong';
    if (strength >= 60) return 'Good';
    if (strength >= 40) return 'Fair';
    return 'Weak';
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Card brand and strength indicator */}
      <div className="flex items-center justify-between">
        {cardBrand && (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="capitalize">
              {cardBrand}
            </Badge>
          </div>
        )}
        
        {showStrength && totalRequired > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Validation:</span>
            <span className={cn("text-sm font-medium", getStrengthColor(validationStrength))}>
              {getStrengthLabel(validationStrength)}
            </span>
          </div>
        )}
      </div>

      {/* Validation rules */}
      <div className="space-y-2">
        {validationRules.map((rule) => (
          <div
            key={rule.id}
            className={cn(
              "flex items-start gap-3 p-2 rounded-lg transition-all duration-200",
              rule.status === 'valid' && "bg-success/5 border border-success/20",
              rule.status === 'invalid' && "bg-destructive/5 border border-destructive/20",
              rule.status === 'checking' && "bg-warning/5 border border-warning/20",
              rule.status === 'pending' && "bg-muted/20"
            )}
          >
            {getValidationIcon(rule.status)}
            <div className="flex-1 min-w-0">
              <div className={cn(
                "text-sm font-medium",
                rule.status === 'valid' && "text-success",
                rule.status === 'invalid' && "text-destructive",
                rule.status === 'checking' && "text-warning",
                rule.status === 'pending' && "text-muted-foreground"
              )}>
                {rule.label}
                {rule.required && <span className="text-destructive ml-1">*</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {rule.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar for overall validation */}
      {showStrength && totalRequired > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Form Completion</span>
            <span className={cn("font-medium", getStrengthColor(validationStrength))}>
              {Math.round(validationStrength)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                validationStrength >= 80 && "bg-success",
                validationStrength >= 60 && validationStrength < 80 && "bg-warning",
                validationStrength < 60 && "bg-destructive"
              )}
              style={{ width: `${validationStrength}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}