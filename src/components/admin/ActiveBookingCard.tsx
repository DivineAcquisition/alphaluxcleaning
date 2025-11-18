import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Mail, Phone, MapPin } from 'lucide-react';
import type { ActiveBooking } from '@/hooks/useBookingMonitor';

interface ActiveBookingCardProps {
  booking: ActiveBooking;
}

const STEP_NAMES: Record<string, string> = {
  zip: 'ZIP Code Entry',
  sqft: 'Home Size Selection',
  offer: 'Offer Selection',
  checkout: 'Payment Checkout',
  details: 'Service Details',
  confirmation: 'Confirmation',
};

export function ActiveBookingCard({ booking }: ActiveBookingCardProps) {
  const timeOnStepMinutes = Math.floor(booking.time_on_step / 1000 / 60);
  const timeOnStepSeconds = Math.floor((booking.time_on_step / 1000) % 60);

  const isStalled = booking.time_on_step > 5 * 60 * 1000; // 5 minutes

  return (
    <Card className="p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{booking.customer_name}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{booking.customer_email}</span>
          </div>
          {booking.customer_phone && (
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{booking.customer_phone}</span>
            </div>
          )}
          {booking.zip_code && (
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>ZIP: {booking.zip_code}</span>
            </div>
          )}
        </div>
        <Badge variant={isStalled ? 'destructive' : 'secondary'}>
          {STEP_NAMES[booking.current_step] || booking.current_step}
        </Badge>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress: {booking.progress_percentage}%</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {timeOnStepMinutes}m {timeOnStepSeconds}s on this step
            </span>
          </div>
        </div>
        <Progress value={booking.progress_percentage} className="h-2" />
      </div>

      {booking.service_type && (
        <div className="pt-2 border-t text-xs text-muted-foreground">
          <span className="font-medium">{booking.service_type}</span>
          {booking.frequency && <span> • {booking.frequency}</span>}
          {booking.est_price > 0 && (
            <span className="ml-2 font-semibold text-foreground">
              ${booking.est_price.toFixed(2)}
            </span>
          )}
        </div>
      )}

      {isStalled && (
        <Badge variant="outline" className="w-full justify-center text-xs">
          ⚠️ Stalled - No activity for 5+ minutes
        </Badge>
      )}
    </Card>
  );
}
