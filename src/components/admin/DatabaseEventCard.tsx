import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { DatabaseEvent } from '@/hooks/useDatabaseRealtime';

interface DatabaseEventCardProps {
  event: DatabaseEvent;
}

const OPERATION_ICONS: Record<string, any> = {
  INSERT: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
};

const OPERATION_COLORS: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export function DatabaseEventCard({ event }: DatabaseEventCardProps) {
  const Icon = OPERATION_ICONS[event.operation];
  const colorClass = OPERATION_COLORS[event.operation];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={colorClass}>
            <Icon className="h-3 w-3 mr-1" />
            {event.operation}
          </Badge>
          <Badge variant="outline">{event.table}</Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
        </span>
      </div>

      {/* New Record */}
      {event.new_record && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            {event.operation === 'UPDATE' ? 'New Values' : 'Record Data'}
          </p>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-40 overflow-y-auto">
            {JSON.stringify(event.new_record, null, 2)}
          </pre>
        </div>
      )}

      {/* Old Record (for UPDATE/DELETE) */}
      {event.old_record && event.operation !== 'INSERT' && (
        <div className="space-y-2 mt-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            {event.operation === 'UPDATE' ? 'Old Values' : 'Deleted Record'}
          </p>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-40 overflow-y-auto">
            {JSON.stringify(event.old_record, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
}
