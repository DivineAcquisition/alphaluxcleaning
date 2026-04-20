import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign,
  Search,
  Eye,
  Filter,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CustomerPortalBookingsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const checkAuth = () => {
      const portalToken = localStorage.getItem('customer_portal_token');
      if (!portalToken) {
        navigate('/portal/login');
        return false;
      }
      return true;
    };

    if (checkAuth()) {
      // Mock bookings data
      setTimeout(() => {
        setBookings([
          {
            id: 'booking-123',
            service_type: 'Deep Cleaning',
            scheduled_date: '2024-01-15',
            scheduled_time: '10:00 AM',
            address: '123 Main St, New York, NY',
            status: 'scheduled',
            total_amount: 180,
            payment_status: 'paid'
          },
          {
            id: 'booking-124',
            service_type: 'Regular Cleaning',
            scheduled_date: '2023-12-28',
            scheduled_time: '2:00 PM',
            address: '123 Main St, New York, NY',
            status: 'completed',
            total_amount: 120,
            payment_status: 'paid'
          },
          {
            id: 'booking-125',
            service_type: 'Move-out Cleaning',
            scheduled_date: '2024-02-01',
            scheduled_time: '9:00 AM',
            address: '456 Oak Ave, Brooklyn, NY',
            status: 'confirmed',
            total_amount: 250,
            payment_status: 'deposit_paid'
          }
        ]);
        setLoading(false);
      }, 1000);
    }
  }, [navigate]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      scheduled: 'default',
      confirmed: 'default',
      in_progress: 'secondary',
      completed: 'outline',
      cancelled: 'destructive'
    };
    
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-500 text-white',
      confirmed: 'bg-green-500 text-white',
      in_progress: 'bg-yellow-500 text-white',
      completed: 'bg-gray-500 text-white',
      cancelled: 'bg-red-500 text-white'
    };
    
    return (
      <Badge className={colors[status] || 'bg-gray-400 text-white'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-500 text-white',
      deposit_paid: 'bg-yellow-500 text-white',
      unpaid: 'bg-red-500 text-white'
    };
    
    return (
      <Badge className={colors[paymentStatus] || 'bg-gray-400 text-white'}>
        {paymentStatus.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/portal')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Bookings</h1>
            <p className="text-muted-foreground">View and manage your service appointments</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'scheduled' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('scheduled')}
                >
                  Scheduled
                </Button>
                <Button
                  variant={statusFilter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('completed')}
                >
                  Completed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{booking.service_type}</h3>
                      {getStatusBadge(booking.status)}
                      {getPaymentBadge(booking.payment_status)}
                    </div>
                    
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{new Date(booking.scheduled_date).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.scheduled_time}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>${booking.total_amount}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">{booking.address}</span>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/portal/bookings/${booking.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBookings.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No bookings match your current filters.' 
                  : "You don't have any bookings yet."}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => window.open('https://app.alphaluxclean.com/booking', '_blank')}>
                  Book Your First Service
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{bookings.length}</div>
              <div className="text-sm text-muted-foreground">Total Bookings</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {bookings.filter(b => b.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed Services</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {bookings.filter(b => ['scheduled', 'confirmed'].includes(b.status)).length}
              </div>
              <div className="text-sm text-muted-foreground">Upcoming Services</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}