import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, Loader2, Mail, MailOpen, MousePointer, AlertTriangle, Ban } from 'lucide-react';
import { AdminRoute } from '@/components/AdminRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface EmailEvent {
  id: string;
  provider: string;
  event: string;
  recipient: string;
  message_id: string | null;
  meta: any;
  created_at: string;
}

const eventIcons = {
  delivered: Mail,
  opened: MailOpen,
  clicked: MousePointer,
  bounced: AlertTriangle,
  complained: Ban
} as const;

const eventColors = {
  delivered: 'default',
  opened: 'secondary',
  clicked: 'default',
  bounced: 'destructive',
  complained: 'destructive'
} as const;

export default function AdminEmailEvents() {
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupedEvents, setGroupedEvents] = useState<Record<string, EmailEvent[]>>({});

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('email_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      
      setEvents(data || []);
      
      // Group events by message_id
      const grouped = (data || []).reduce((acc, event) => {
        const key = event.message_id || event.recipient;
        if (!acc[key]) acc[key] = [];
        acc[key].push(event);
        return acc;
      }, {} as Record<string, EmailEvent[]>);
      
      setGroupedEvents(grouped);
    } catch (error) {
      console.error('Failed to load email events:', error);
      toast.error('Failed to load email events');
    } finally {
      setLoading(false);
    }
  };

  const renderEventBadge = (event: EmailEvent) => {
    const Icon = eventIcons[event.event as keyof typeof eventIcons] || Mail;
    const color = eventColors[event.event as keyof typeof eventColors] || 'default';
    
    return (
      <Badge key={event.id} variant={color} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {event.event}
      </Badge>
    );
  };

  return (
    <AdminRoute requiredRole="viewer">
      <Helmet>
        <title>Email Events - Admin</title>
      </Helmet>
      
      <AdminLayout title="Email Events">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Email Events</h1>
              <p className="text-muted-foreground">
                Track email delivery and engagement events
              </p>
            </div>
            <Button onClick={loadEvents} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {events.filter(e => e.event === 'delivered').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Opened</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {events.filter(e => e.event === 'opened').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Clicked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {events.filter(e => e.event === 'clicked').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {events.filter(e => ['bounced', 'complained'].includes(e.event)).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event Timeline</CardTitle>
              <CardDescription>
                Recent email delivery and engagement events grouped by message
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Message ID</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Latest Event</TableHead>
                      <TableHead>Provider</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedEvents)
                      .slice(0, 50)
                      .map(([messageId, messageEvents]) => {
                        const latestEvent = messageEvents[0];
                        return (
                          <TableRow key={messageId}>
                            <TableCell className="font-medium">
                              {latestEvent.recipient}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {messageId.length > 20 ? `${messageId.slice(0, 20)}...` : messageId}
                              </code>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {messageEvents
                                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                  .map(renderEventBadge)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(latestEvent.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{latestEvent.provider}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}