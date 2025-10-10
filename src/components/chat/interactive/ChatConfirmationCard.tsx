import { Button } from '@/components/ui/button';
import { Check, Edit2 } from 'lucide-react';

interface ChatConfirmationCardProps {
  question: string;
  confirmationData: Record<string, any>;
  onConfirm: () => void;
  onEdit?: (field: string) => void;
}

export function ChatConfirmationCard({ 
  question, 
  confirmationData, 
  onConfirm,
  onEdit 
}: ChatConfirmationCardProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground">{question}</h3>
      
      <div className="bg-muted rounded-lg p-4 space-y-3">
        {Object.entries(confirmationData).map(([key, value]) => (
          <div key={key} className="flex items-start justify-between gap-3 pb-2 border-b border-border last:border-0 last:pb-0">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground capitalize mb-0.5">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(key)}
                className="h-7 w-7 shrink-0"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button 
        onClick={onConfirm}
        className="w-full gap-2"
      >
        <Check className="h-4 w-4" />
        Looks Good - Confirm Booking
      </Button>
    </div>
  );
}
