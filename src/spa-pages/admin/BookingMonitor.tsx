import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActiveBookingCard } from '@/components/admin/ActiveBookingCard';
import { BookingActivityFeed } from '@/components/admin/BookingActivityFeed';
import { useBookingMonitor } from '@/hooks/useBookingMonitor';
import { Activity, RefreshCw, Users, TrendingUp } from 'lucide-react';

export default function BookingMonitor() {
  const { activeBookings, recentEvents, isLoading, refetch } = useBookingMonitor();

  const completionRate = activeBookings.length > 0
    ? ((activeBookings.filter(b => b.progress_percentage >= 66).length / activeBookings.length) * 100).toFixed(1)
    : '0';

  const avgTimeOnSite = activeBookings.length > 0
    ? Math.floor(activeBookings.reduce((sum, b) => sum + b.time_on_step, 0) / activeBookings.length / 1000 / 60)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Real-Time Booking Monitor - AlphaLux Admin</title>
        <meta name="description" content="Monitor active bookings in real-time" />
      </Helmet>

      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              Real-Time Booking Monitor
            </h1>
            <p className="text-muted-foreground mt-1">
              Track active bookings and conversion metrics live
            </p>
          </div>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {activeBookings.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                In last 30 minutes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {completionRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Reached checkout or beyond
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Avg. Time on Site
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {avgTimeOnSite}m
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Average session duration
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Bookings Panel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Active Bookings
                  {activeBookings.length > 0 && (
                    <Badge variant="secondary">{activeBookings.length}</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-muted-foreground">Live</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : activeBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No active bookings in the last 30 minutes</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    New bookings will appear here automatically
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {activeBookings.map((booking) => (
                    <ActiveBookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <BookingActivityFeed events={recentEvents} />
        </div>

        {/* Auto-refresh indicator */}
        <div className="mt-6 text-center">
          <Badge variant="outline" className="text-xs">
            Auto-refreshing every 5 seconds
          </Badge>
        </div>
      </div>
    </div>
  );
}
