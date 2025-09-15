import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Percent, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RecurringService {
  id: string;
  cleaning_type: string;
  frequency: string;
  next_service_date: string;
  preferred_time: string;
  service_status: string;
  amount: number;
}

interface CancellationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: RecurringService;
  onSuccess: () => void;
}

export function CancellationDialog({ open, onOpenChange, service, onSuccess }: CancellationDialogProps) {
  const [step, setStep] = useState<'initial' | 'discount' | 'confirm'>('initial');
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const discountedAmount = Math.round(service.amount * 0.75); // 25% discount
  const savingsAmount = service.amount - discountedAmount;

  // Calculate hours until service
  const hoursUntilService = service.next_service_date 
    ? Math.ceil((new Date(service.next_service_date).getTime() - new Date().getTime()) / (1000 * 60 * 60))
    : null;
  
  const isWithin24Hours = hoursUntilService !== null && hoursUntilService <= 24;

  const handleInitialCancel = () => {
    setStep('discount');
  };

  const handleAcceptDiscount = async () => {
    setLoading(true);
    try {
      // Update service with discount
      const { error } = await supabase
        .from('orders')
        .update({
          amount: discountedAmount,
          retention_discount_offered: true,
          retention_discount_accepted: true
        })
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
          notificationType: 'discount_applied',
          customerEmail: user.user?.email,
          customerName: profile?.full_name || 'Valued Customer',
          cleaningType: service.cleaning_type,
          frequency: service.frequency,
          originalAmount: service.amount,
          discountedAmount: discountedAmount,
          savingsAmount: savingsAmount,
          nextServiceDate: service.next_service_date ? new Date(service.next_service_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'TBD',
          nextServiceTime: service.preferred_time || '9:00 AM'
        }
      });

      toast({
        title: "Discount Applied!",
        description: `Great! Your service now costs $${(discountedAmount / 100).toFixed(2)} per ${service.frequency} service.`,
      });

      onSuccess();
      onOpenChange(false);
      setStep('initial');
    } catch (error) {
      console.error('Error applying discount:', error);
      toast({
        title: "Error",
        description: "Failed to apply discount",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalCancel = async () => {
    if (!reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for cancellation",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Cancel the service
      const { error } = await supabase
        .from('orders')
        .update({
          service_status: 'cancelled',
          cancellation_reason: reason,
          retention_discount_offered: true,
          retention_discount_accepted: false
        })
        .eq('id', service.id);

      if (error) throw error;

      // Note: Simplified - removed complex modification logging

      // Send cancellation email
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.user?.id)
        .single();

      await supabase.functions.invoke('send-service-notification', {
        body: {
          orderId: service.id,
          notificationType: 'cancelled',
          customerEmail: user.user?.email,
          customerName: profile?.full_name || 'Valued Customer',
          cleaningType: service.cleaning_type,
          frequency: service.frequency,
          cancellationReason: reason,
          discountOffered: true,
          discountAccepted: false
        }
      });

      toast({
        title: "Service Cancelled",
        description: "Your service has been cancelled. We're sorry to see you go!",
      });

      onSuccess();
      onOpenChange(false);
      setStep('initial');
      setReason("");
    } catch (error) {
      console.error('Error cancelling service:', error);
      toast({
        title: "Error",
        description: "Failed to cancel service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep('initial');
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'initial' && (
          <>
            <DialogHeader>
              <DialogTitle>Cancel Service</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel your {service.cleaning_type} cleaning service?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* 24-Hour Cancellation Policy Warning */}
              {isWithin24Hours && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertDescription className="text-amber-800">
                    <div className="font-semibold">⚠️ 24-Hour Cancellation Policy</div>
                    <div className="mt-1">
                      Your cleaning is scheduled within the next {hoursUntilService} hours. 
                      Cancelling now may result in a cancellation fee.
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertDescription>
                  Once cancelled, your recurring service will stop and no future cleanings will be scheduled.
                  {isWithin24Hours && (
                    <div className="mt-2 text-amber-700 font-medium">
                      Note: A cancellation fee may apply for cancellations within 24 hours of service.
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Keep Service
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleInitialCancel}
                  className="flex-1"
                >
                  Cancel Service
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'discount' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Wait! Special Offer
              </DialogTitle>
              <DialogDescription>
                Before you go, we'd like to offer you a special discount to keep your service
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <Percent className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="font-semibold">25% OFF Your Service!</div>
                  <div className="mt-1">
                    Your new price: <span className="font-bold">${(discountedAmount / 100).toFixed(2)}</span> per {service.frequency} service
                  </div>
                  <div className="text-sm mt-1">
                    You'll save ${(savingsAmount / 100).toFixed(2)} on each service!
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep('confirm')}
                  className="flex-1"
                  disabled={loading}
                >
                  No Thanks
                </Button>
                <Button
                  onClick={handleAcceptDiscount}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? "Applying..." : "Accept Discount"}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Cancellation</DialogTitle>
              <DialogDescription>
                Please let us know why you're cancelling so we can improve our service
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Reason for cancellation *</Label>
                <Textarea
                  id="reason"
                  placeholder="Please tell us why you're cancelling..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Keep Service
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleFinalCancel}
                  className="flex-1"
                  disabled={loading || !reason.trim()}
                >
                  {loading ? "Cancelling..." : "Cancel Service"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}