import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  description?: string;
  badge?: string;
}

interface ChatOptionButtonsProps {
  options: Option[];
  onSelect: (id: string, label: string) => void;
}

export function ChatOptionButtons({ options, onSelect }: ChatOptionButtonsProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  useState(() => {
    const timer = setTimeout(() => setShowOptions(true), 300);
    return () => clearTimeout(timer);
  });

  const handleSelect = (option: Option) => {
    setSelected(option.id);
    setTimeout(() => {
      onSelect(option.id, option.label);
    }, 200);
  };

  return (
    <div 
      className={cn(
        "grid gap-3 transition-all duration-500",
        showOptions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => handleSelect(option)}
          disabled={selected !== null}
          className={cn(
            "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
            "hover:border-primary hover:bg-primary/5 hover:scale-[1.02]",
            "disabled:cursor-not-allowed",
            selected === option.id 
              ? "border-primary bg-primary/10 scale-[1.02]" 
              : "border-border bg-card"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground">{option.label}</h4>
                {option.badge && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                    {option.badge}
                  </span>
                )}
              </div>
              {option.description && (
                <p className="text-sm text-muted-foreground">{option.description}</p>
              )}
            </div>
            {selected === option.id && (
              <Check className="h-5 w-5 text-primary shrink-0 animate-scale-in" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
