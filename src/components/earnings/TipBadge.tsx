import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';

interface TipBadgeProps {
  amount: number;
  size?: 'sm' | 'default';
}

export function TipBadge({ amount, size = 'default' }: TipBadgeProps) {
  if (amount <= 0) return null;

  return (
    <Badge 
      variant="outline" 
      className={`bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-300 dark:border-green-800 ${
        size === 'sm' ? 'text-xs px-2 py-1' : ''
      }`}
    >
      <DollarSign className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
      ${amount.toFixed(2)} tip
    </Badge>
  );
}