import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateServiceAreaZipCode } from "@/lib/service-area-validation";

interface UpdateAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    customer_email: string;
    customer_name: string;
    service_details?: {
      address?: {
        street: string;
        apartment?: string;
        city: string;
        state: string;
        zipCode: string;
      };
    };
  };
  onSuccess?: () => void;
}

export const UpdateAddressDialog = ({ 
  open, 
  onOpenChange, 
  order, 
  onSuccess 
}: UpdateAddressDialogProps) => {
  const [newAddress, setNewAddress] = useState({
    street: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: ""
  });
  const [customerNotes, setCustomerNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const currentAddress = order.service_details?.address;

  const handleSubmit = async () => {
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
      toast.error("Please fill in all required address fields");
      return;
    }

    // Validate service area with selected state
    const zipValidation = validateServiceAreaZipCode(newAddress.zipCode, newAddress.state);
    if (!zipValidation.isValid) {
      toast.error(zipValidation.message || "ZIP code is outside our service area");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('customer_service_requests')
        .insert({
          order_id: order.id,
          request_type: 'address_change',
          requested_by_email: order.customer_email,
          requested_by_name: order.customer_name,
          request_data: {
            new_address: newAddress,
            current_address: currentAddress
          },
          customer_notes: customerNotes
        });

      if (error) throw error;

      toast.success("Address change request submitted! We'll review and contact you to confirm pricing and service area coverage.");
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setNewAddress({
        street: "",
        apartment: "",
        city: "",
        state: "",
        zipCode: ""
      });
      setCustomerNotes("");
    } catch (error) {
      console.error('Error submitting address change request:', error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Update Service Address
          </DialogTitle>
          <DialogDescription>
            Request to change your service address. We'll verify service area and pricing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Address */}
          {currentAddress && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">Current Address:</div>
              <div className="text-sm text-muted-foreground">
                {currentAddress.street}
                {currentAddress.apartment && `, ${currentAddress.apartment}`}
                <br />
                {currentAddress.city}, {currentAddress.state} {currentAddress.zipCode}
              </div>
            </div>
          )}

          {/* New Address Form */}
          <div className="space-y-3">
            <h4 className="font-medium">New Service Address</h4>
            
            <div className="space-y-2">
              <Label htmlFor="street">Street Address *</Label>
              <Input
                id="street"
                value={newAddress.street}
                onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                placeholder="123 Main Street"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apartment">Apartment/Unit (Optional)</Label>
              <Input
                id="apartment"
                value={newAddress.apartment}
                onChange={(e) => setNewAddress(prev => ({ ...prev, apartment: e.target.value }))}
                placeholder="Apt 2B, Unit 101, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="San Francisco"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="CA"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={newAddress.zipCode}
                onChange={(e) => setNewAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                placeholder="94102"
                maxLength={10}
              />
            </div>
          </div>

          {/* Warning Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Address changes may affect pricing and service availability. We'll verify the new location is within our service area and provide any pricing updates.
            </AlertDescription>
          </Alert>

          {/* Customer Notes */}
          <div className="space-y-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Special access instructions, parking notes, etc."
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
              disabled={isLoading || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipCode}
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