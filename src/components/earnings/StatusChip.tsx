import { Badge } from '@/components/ui/badge';

interface StatusChipProps {
  status: 'pending' | 'processing' | 'paid' | 'on_hold' | 'failed' | 'open';
  size?: 'sm' | 'default';
}

export function StatusChip({ status, size = 'default' }: StatusChipProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
          label: 'Paid'
        };
      case 'pending':
        return {
          variant: 'secondary' as const,
          className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
          label: 'Pending'
        };
      case 'processing':
        return {
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
          label: 'Processing'
        };
      case 'on_hold':
        return {
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
          label: 'On Hold'
        };
      case 'failed':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
          label: 'Failed'
        };
      case 'open':
        return {
          variant: 'outline' as const,
          className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-300',
          label: 'Open'
        };
      default:
        return {
          variant: 'secondary' as const,
          className: '',
          label: status.charAt(0).toUpperCase() + status.slice(1)
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${size === 'sm' ? 'text-xs px-2 py-1' : ''}`}
    >
      {config.label}
    </Badge>
  );
}