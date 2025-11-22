import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Navigation } from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TestBooking {
  id: string;
  created_at: string;
  offer_name: string;
  est_price: number;
  deposit_amount: number;
  square_payment_id: string;
  payment_status: string;
}

export default function DevTestCleanup() {
  const [testBookings, setTestBookings] = useState<TestBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | 'all'>('all');

  useEffect(() => {
    fetchTestBookings();
  }, []);

  const fetchTestBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, created_at, offer_name, est_price, deposit_amount, square_payment_id, payment_status')
        .or('square_payment_id.like.test_%,square_payment_id.eq.test-mode-payment')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestBookings(data || []);
    } catch (error) {
      console.error('Failed to fetch test bookings:', error);
      toast.error('Failed to load test bookings');
    } finally {
      setLoading(false);
    }
  };

  const deleteTestBooking = async (bookingId: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;
      
      toast.success('Test booking deleted');
      fetchTestBookings();
    } catch (error) {
      console.error('Failed to delete booking:', error);
      toast.error('Failed to delete booking');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const deleteAllTestBookings = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .or('square_payment_id.like.test_%,square_payment_id.eq.test-mode-payment');

      if (error) throw error;
      
      toast.success(`Deleted ${testBookings.length} test bookings`);
      fetchTestBookings();
    } catch (error) {
      console.error('Failed to delete bookings:', error);
      toast.error('Failed to delete bookings');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const confirmDelete = (bookingId: string | 'all') => {
    setBookingToDelete(bookingId);
    setShowDeleteDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Test Booking Cleanup</h1>
            <p className="text-muted-foreground">
              Manage and delete test bookings created in demo mode
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchTestBookings} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {testBookings.length > 0 && (
              <Button onClick={() => confirmDelete('all')} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All ({testBookings.length})
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : testBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No test bookings found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Test bookings are identified by payment IDs starting with "test_". 
                Deleting these will permanently remove all associated data.
              </AlertDescription>
            </Alert>

            {testBookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {booking.offer_name || 'Test Booking'}
                        <Badge variant="outline" className="font-mono text-xs">
                          {booking.id.slice(0, 8)}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Created {new Date(booking.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => confirmDelete(booking.id)}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Total Price</p>
                      <p className="font-medium">${booking.est_price?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Deposit</p>
                      <p className="font-medium">${booking.deposit_amount?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Payment ID</p>
                      <p className="font-mono text-xs">{booking.square_payment_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Status</p>
                      <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                        {booking.payment_status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {bookingToDelete === 'all'
                ? `This will permanently delete all ${testBookings.length} test bookings and their associated data. This action cannot be undone.`
                : 'This will permanently delete this test booking and all associated data. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bookingToDelete === 'all' ? deleteAllTestBookings() : deleteTestBooking(bookingToDelete)}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
