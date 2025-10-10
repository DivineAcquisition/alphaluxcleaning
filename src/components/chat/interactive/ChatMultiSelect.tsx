import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiSelectOption {
  id: string;
  label: string;
  description?: string;
}

interface ChatMultiSelectProps {
  question: string;
  options: MultiSelectOption[];
  onSubmit: (selectedIds: string[]) => void;
  minSelections?: number;
  maxSelections?: number;
}

export function ChatMultiSelect({ 
  question, 
  options, 
  onSubmit,
  minSelections = 0,
  maxSelections
}: ChatMultiSelectProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const toggleSelection = (id: string) => {
    if (hasSubmitted) return;

    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        // Check max selections
        if (maxSelections && prev.length >= maxSelections) {
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const handleSubmit = () => {
    if (selected.length < minSelections) return;
    setHasSubmitted(true);
    onSubmit(selected);
  };

  const canSubmit = selected.length >= minSelections;
  const isOptional = minSelections === 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isDisabled = hasSubmitted || (maxSelections ? selected.length >= maxSelections && !isSelected : false);
          
          return (
            <button
              key={option.id}
              onClick={() => toggleSelection(option.id)}
              disabled={isDisabled}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200",
                "hover:shadow-md active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                  isSelected 
                    ? "bg-primary border-primary" 
                    : "border-muted-foreground/30"
                )}>
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">{option.label}</p>
                  {option.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-muted-foreground">
          {selected.length > 0 && (
            <span>
              {selected.length} selected
              {maxSelections && ` (max ${maxSelections})`}
            </span>
          )}
          {selected.length === 0 && isOptional && (
            <span>Optional - select any or skip</span>
          )}
          {selected.length === 0 && !isOptional && (
            <span>Select at least {minSelections}</span>
          )}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || hasSubmitted}
          className="gap-2"
        >
          {isOptional && selected.length === 0 ? 'Skip' : 'Continue'}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
