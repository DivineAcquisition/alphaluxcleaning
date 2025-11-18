import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface DatabaseEvent {
  id: string;
  timestamp: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_record?: any;
  new_record?: any;
}

interface UseDatabaseRealtimeOptions {
  tables: string[];
  onEvent?: (event: DatabaseEvent) => void;
}

export function useDatabaseRealtime({ tables, onEvent }: UseDatabaseRealtimeOptions) {
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const channels: RealtimeChannel[] = [];

    tables.forEach((table) => {
      const channel = supabase
        .channel(`db-changes-${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          (payload) => {
            const event: DatabaseEvent = {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              table: table,
              operation: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              old_record: payload.old,
              new_record: payload.new,
            };

            setEvents((prev) => [event, ...prev].slice(0, 100)); // Keep last 100 events
            onEvent?.(event);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
          }
        });

      channels.push(channel);
    });

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      setIsConnected(false);
    };
  }, [tables, onEvent, isPaused]);

  const clearEvents = () => setEvents([]);
  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  return {
    events,
    isConnected,
    isPaused,
    clearEvents,
    pause,
    resume,
  };
}
