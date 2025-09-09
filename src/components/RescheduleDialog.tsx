import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { toLocalDate } from '@/lib/date-helpers';

interface RecurringService {
  id: string;
  cleaning_type: string;
  frequency: string;
  next_service_date: string;
  preferred_time: string;
  service_status: string;
  amount: number;
}

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: RecurringService;
  onSuccess: () => void;
}

const timeSlots = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
];

export function RescheduleDialog({ open, onOpenChange, service, onSuccess }: RescheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    service.next_service_date ? new Date(service.next_service_date) : undefined
  );
  const [selectedTime, setSelectedTime] = useState(service.preferred_time || "");
  const [loading, setLoading] = useState(false);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both a date and time');
      return;
    }

    setLoading(true);
    try {
      const oldValues = {
        next_service_date: service.next_service_date,
        preferred_time: service.preferred_time
      };

      const newValues = {
        next_service_date: toLocalDate(selectedDate),
        preferred_time: selectedTime
      };

      // Update the service
      const { error } = await supabase
        .from('orders')
        .update(newValues)
        .eq('id', service.id);

      if (error) throw error;

      // Note: Simplified - removed complex modification logging

      // Send email notification
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.user?.id)
        .single();

      await supabase.functions.invoke('send-service-notification', {
        body: {
          orderId: service.id,
          notificationType: 'rescheduled',
          customerEmail: user.user?.email,
          customerName: profile?.full_name || 'Valued Customer',
          cleaningType: service.cleaning_type,
          frequency: service.frequency,
          serviceAddress: '',
          oldDate: oldValues.next_service_date ? new Date(oldValues.next_service_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : '',
          oldTime: oldValues.preferred_time,
          newDate: selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          newTime: selectedTime
        }
      });

      toast.success(`Service rescheduled to ${selectedDate.toLocaleDateString()} at ${selectedTime}`);

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error rescheduling service:', error);
      toast.error('Failed to reschedule service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Service</DialogTitle>
          <DialogDescription>
            Select a new date and time for your {service.cleaning_type} cleaning service
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">Select New Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          <div>
            <Label className="text-base font-medium mb-3 block">Select Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              className="flex-1"
              disabled={loading || !selectedDate || !selectedTime}
            >
              {loading ? "Rescheduling..." : "Reschedule Service"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}