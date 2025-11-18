import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BookingEvent {
  id: string;
  created_at: string;
  event_type: string;
  step_name: string | null;
  error_message: string | null;
  event_data: any;
}

interface BookingActivityFeedProps {
  events: BookingEvent[];
}

const EVENT_ICONS: Record<string, any> = {
  step_started: Activity,
  step_completed: CheckCircle2,
  error: XCircle,
  payment_attempt: AlertCircle,
};

const EVENT_COLORS: Record<string, string> = {
  step_started: 'text-blue-500',
  step_completed: 'text-green-500',
  error: 'text-red-500',
  payment_attempt: 'text-yellow-500',
};

export function BookingActivityFeed({ events }: BookingActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              events.map((event) => {
                const Icon = EVENT_ICONS[event.event_type] || Activity;
                const colorClass = EVENT_COLORS[event.event_type] || 'text-muted-foreground';

                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Icon className={`h-4 w-4 mt-0.5 ${colorClass}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {event.event_type}
                        </Badge>
                        {event.step_name && (
                          <span className="text-xs text-muted-foreground">
                            {event.step_name}
                          </span>
                        )}
                      </div>
                      {event.error_message && (
                        <p className="text-sm text-red-500 mt-1">{event.error_message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
