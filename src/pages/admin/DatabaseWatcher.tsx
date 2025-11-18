import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DatabaseEventCard } from '@/components/admin/DatabaseEventCard';
import { useDatabaseRealtime } from '@/hooks/useDatabaseRealtime';
import { Database, Pause, Play, RotateCcw, Download } from 'lucide-react';
import { useState } from 'react';

const WATCHED_TABLES = [
  'bookings',
  'customers',
  'payments',
  'integration_logs',
  'email_jobs',
  'webhook_queue',
  'hcp_sync_log',
  'booking_events',
  'test_runs',
];

export default function DatabaseWatcher() {
  const [selectedTables, setSelectedTables] = useState<string[]>(WATCHED_TABLES);
  
  const { events, isConnected, isPaused, clearEvents, pause, resume } = useDatabaseRealtime({
    tables: selectedTables,
  });

  const handleExport = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `db-events-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleTable = (table: string) => {
    setSelectedTables((prev) =>
      prev.includes(table)
        ? prev.filter((t) => t !== table)
        : [...prev, table]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Real-Time Database Watcher - AlphaLux Admin</title>
        <meta name="description" content="Monitor database changes in real-time" />
      </Helmet>

      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              Real-Time Database Watcher
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor all database changes live as they happen
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? (
                <>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  Connected
                </>
              ) : (
                'Disconnected'
              )}
            </Badge>
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Controls & Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={isPaused ? resume : pause}
                  variant="outline"
                  size="sm"
                >
                  {isPaused ? (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  )}
                </Button>
                <Button onClick={clearEvents} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button onClick={handleExport} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
                <div className="flex-1"></div>
                <Badge variant="secondary">
                  {events.length} events
                </Badge>
              </div>

              {/* Table Filters */}
              <div>
                <p className="text-sm font-medium mb-2">Watched Tables:</p>
                <div className="flex flex-wrap gap-2">
                  {WATCHED_TABLES.map((table) => (
                    <Badge
                      key={table}
                      variant={selectedTables.includes(table) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTable(table)}
                    >
                      {table}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Stream */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live Event Stream</span>
              {isPaused && (
                <Badge variant="secondary">Paused</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No events yet</h3>
                  <p className="text-muted-foreground">
                    {isPaused
                      ? 'Monitoring is paused. Click Resume to start watching.'
                      : 'Database changes will appear here in real-time.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <DatabaseEventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Info Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Watching {selectedTables.length} tables • Events auto-expire after 100 entries
          </p>
        </div>
      </div>
    </div>
  );
}
