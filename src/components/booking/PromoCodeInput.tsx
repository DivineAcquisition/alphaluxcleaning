import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Tag } from 'lucide-react';

interface PromoCodeInputProps {
  subtotalCents: number;
  bookingType?: string;
  onApply: (code: string, discountCents: number) => void;
  onRemove: () => void;
  appliedCode?: string;
  appliedDiscount?: number;
}

export function PromoCodeInput({
  subtotalCents,
  bookingType = 'ONE_TIME',
  onApply,
  onRemove,
  appliedCode,
  appliedDiscount
}: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleValidate = async () => {
    if (!code.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('promo-system', {
        body: {
          action: 'validate',
          code: code.trim(),
          subtotal_cents: subtotalCents,
          booking_type: bookingType
        }
      });

      if (error) throw error;

      if (data.valid) {
        onApply(data.code, data.discount_cents);
        toast.success(data.display);
        setExpanded(false);
      } else {
        toast.error(data.reason || 'Invalid promo code');
      }
    } catch (error) {
      console.error('Promo validation error:', error);
      toast.error('Failed to validate promo code');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    onRemove();
    toast.info('Promo code removed');
  };

  if (appliedCode && appliedDiscount) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-900 dark:text-green-100">
            {appliedCode}
          </span>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">
            -${(appliedDiscount / 100).toFixed(2)}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full text-left p-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-primary hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Tag className="h-4 w-4" />
          <span>Have a promo code?</span>
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-2 p-3 border border-gray-300 dark:border-gray-700 rounded-lg">
      <div className="flex items-center gap-2 text-sm font-medium mb-2">
        <Tag className="h-4 w-4" />
        <span>Apply Promo Code</span>
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
          disabled={loading}
          className="flex-1"
        />
        <Button
          onClick={handleValidate}
          disabled={loading || !code.trim()}
          size="sm"
        >
          {loading ? 'Validating...' : 'Apply'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
