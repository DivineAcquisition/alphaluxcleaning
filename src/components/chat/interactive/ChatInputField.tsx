import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight } from 'lucide-react';

interface ChatInputFieldProps {
  question: string;
  inputType: 'text' | 'email' | 'phone' | 'date' | 'time' | 'textarea';
  placeholder?: string;
  onSubmit: (value: string) => void;
}

export function ChatInputField({ question, inputType, placeholder, onSubmit }: ChatInputFieldProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const validate = (val: string): boolean => {
    if (!val.trim()) {
      setError('This field is required');
      return false;
    }

    if (inputType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (inputType === 'phone' && !/^[\d\s\-\+\(\)]+$/.test(val)) {
      setError('Please enter a valid phone number');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (validate(value)) {
      onSubmit(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && inputType !== 'textarea') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-3">
        {inputType === 'textarea' ? (
          <Textarea
            ref={inputRef as any}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "min-h-[100px] resize-none",
              error && "border-destructive"
            )}
          />
        ) : (
          <Input
            ref={inputRef as any}
            type={inputType === 'phone' ? 'tel' : inputType}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "text-base",
              error && "border-destructive"
            )}
          />
        )}
        
        {error && (
          <p className="text-sm text-destructive animate-fade-in">{error}</p>
        )}

        <Button 
          type="submit"
          className="w-full gap-2"
          disabled={!value.trim()}
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
