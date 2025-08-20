import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, Clock } from "lucide-react";

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
  const phoneNumber = "(281) 809-9901";

  const handleCallNow = () => {
    window.open(`tel:${phoneNumber.replace(/[^\d]/g, '')}`, '_self');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Request Reschedule
          </DialogTitle>
          <DialogDescription>
            To reschedule your cleaning service, please call our customer service team
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

          {/* Phone Contact Information */}
          <Alert className="border-primary/20 bg-primary/5">
            <Phone className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium text-lg">Call us to reschedule:</div>
                <div className="text-2xl font-bold text-primary">
                  {phoneNumber}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Business Hours: Monday - Friday, 8:00 AM - 6:00 PM
                </div>
                <div className="text-sm">
                  Our team will help you find the perfect new time that works for your schedule.
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Why Call */}
          <div className="text-sm text-muted-foreground space-y-2">
            <div className="font-medium">Why call instead of booking online?</div>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Real-time availability checking</li>
              <li>Coordinate with your assigned cleaner</li>
              <li>Discuss any special requirements</li>
              <li>Immediate confirmation</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={handleCallNow}
              className="flex-1"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};