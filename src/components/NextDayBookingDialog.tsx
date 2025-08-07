import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface NextDayBookingDialogProps {
  children: React.ReactNode;
}

const NextDayBookingDialog = ({ children }: NextDayBookingDialogProps) => {
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const timeSlots = [
    { value: "morning", label: "Morning", time: "8:00 AM - 12:00 PM", available: true },
    { value: "afternoon", label: "Afternoon", time: "12:00 PM - 4:00 PM", available: true },
    { value: "evening", label: "Evening", time: "4:00 PM - 8:00 PM", available: false },
  ];

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleTimeSelect = (timeValue: string) => {
    setSelectedTime(timeValue);
  };

  const handleConfirmBooking = async () => {
    if (!selectedTime) {
      toast.error("Please select a time slot");
      return;
    }

    setIsBooking(true);
    
    try {
      // Simulate booking process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(
        `Next day booking confirmed for ${selectedTime}! You'll be charged the $50 rush fee after service completion.`,
        { duration: 5000 }
      );
      
      setIsOpen(false);
      setSelectedTime("");
    } catch (error) {
      toast.error("Failed to book next day service. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Next Day Priority Booking
          </DialogTitle>
          <DialogDescription>
            Schedule your cleaning service for tomorrow with priority processing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Display */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Service Date</p>
                  <p className="text-lg font-semibold text-primary">{getTomorrowDate()}</p>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  Tomorrow
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Rush Fee Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Rush Service Fee</p>
                <p className="text-amber-700">
                  A $50 rush fee will be charged <strong>after service completion</strong>. 
                  No upfront payment required.
                </p>
              </div>
            </div>
          </div>

          {/* Time Slot Selection */}
          <div className="space-y-3">
            <p className="font-medium text-sm">Select Time Slot</p>
            {timeSlots.map((slot) => (
              <button
                key={slot.value}
                onClick={() => slot.available && handleTimeSelect(slot.value)}
                disabled={!slot.available}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  selectedTime === slot.value
                    ? "border-primary bg-primary/10"
                    : slot.available
                    ? "border-border hover:border-primary/50 hover:bg-primary/5"
                    : "border-border bg-muted cursor-not-allowed opacity-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{slot.label}</span>
                      {selectedTime === slot.value && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{slot.time}</p>
                  </div>
                  {!slot.available && (
                    <Badge variant="secondary" className="text-xs">
                      Unavailable
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
              disabled={isBooking}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmBooking}
              className="flex-1"
              disabled={!selectedTime || isBooking}
            >
              {isBooking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Booking...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Confirm Booking
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NextDayBookingDialog;