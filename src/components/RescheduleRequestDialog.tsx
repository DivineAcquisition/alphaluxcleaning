import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";

interface RescheduleRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    customer_email: string;
    customer_name: string;
    scheduled_date?: string;
    scheduled_time?: string;
  };
  onSuccess?: () => void;
}

export const RescheduleRequestDialog = ({ 
  open, 
  onOpenChange, 
  order, 
  onSuccess 
}: RescheduleRequestDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00"
  ];

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select both date and time");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('customer_service_requests')
        .insert({
          order_id: order.id,
          request_type: 'reschedule',
          requested_by_email: order.customer_email,
          requested_by_name: order.customer_name,
          request_data: {
            new_date: format(selectedDate, 'yyyy-MM-dd'),
            new_time: selectedTime,
            current_date: order.scheduled_date,
            current_time: order.scheduled_time
          },
          customer_notes: customerNotes
        });

      if (error) throw error;

      toast.success("Reschedule request submitted! We'll contact you within 24 hours to confirm.");
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setSelectedDate(undefined);
      setSelectedTime("");
      setCustomerNotes("");
    } catch (error) {
      console.error('Error submitting reschedule request:', error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Request Reschedule
          </DialogTitle>
          <DialogDescription>
            Select your preferred new date and time. We'll review and confirm availability.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Schedule */}
          {order.scheduled_date && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">Current Schedule:</div>
              <div className="text-sm text-muted-foreground">
                {order.scheduled_date} at {order.scheduled_time || 'TBD'}
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Select New Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Select New Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Choose time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {time}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Notes */}
          <div className="space-y-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Any special requirements or preferences..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !selectedDate || !selectedTime}
              className="flex-1"
            >
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};