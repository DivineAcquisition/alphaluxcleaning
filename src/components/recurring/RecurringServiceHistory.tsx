import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, CheckCircle, DollarSign } from 'lucide-react';

interface RecurringServiceHistoryProps {
  customerId: string;
}

export const RecurringServiceHistory = ({ customerId }: RecurringServiceHistoryProps) => {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, [customerId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_recurring_instance', true)
        .eq('status', 'confirmed')
        .order('service_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (bookings.length === 0) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-foreground">Service History</h2>
      <Card className="p-6">
        <div className="space-y-4">
          {bookings.map((booking, index) => (
            <div 
              key={booking.id}
              className={`flex items-center justify-between py-4 ${
                index !== bookings.length - 1 ? 'border-b' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{booking.service_type}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(booking.service_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <DollarSign className="h-4 w-4" />
                  {formatCurrency(Number(booking.est_price))}
                </div>
                {booking.promo_discount_cents > 0 && (
                  <p className="text-xs text-green-500">
                    Saved {formatCurrency(booking.promo_discount_cents / 100)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};