import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface RatingBadgeProps {
  rating: number;
  showStars?: boolean;
  size?: 'sm' | 'default';
}

export function RatingBadge({ rating, showStars = true, size = 'default' }: RatingBadgeProps) {
  const getColor = (rating: number) => {
    if (rating >= 4.5) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
    if (rating >= 4.0) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
    if (rating >= 3.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
    if (rating >= 3.0) return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
    return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
  };

  if (!rating) return null;

  return (
    <Badge 
      variant="outline" 
      className={`${getColor(rating)} ${size === 'sm' ? 'text-xs px-2 py-1' : ''}`}
    >
      {showStars && (
        <Star className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1 fill-current`} />
      )}
      {rating.toFixed(1)}
    </Badge>
  );
}