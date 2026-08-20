import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, Mail, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UpdateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    customer_email: string;
    customer_name: string;
    customer_phone?: string;
  };
  onSuccess?: () => void;
}

export const UpdateContactDialog = ({ 
  open, 
  onOpenChange, 
  order, 
  onSuccess 
}: UpdateContactDialogProps) => {
  const [newContact, setNewContact] = useState({
    email: "",
    phone: "",
    name: ""
  });
  const [customerNotes, setCustomerNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newContact.email && !newContact.phone && !newContact.name) {
      toast.error("Please provide at least one field to update");
      return;
    }

    // Basic email validation if provided
    if (newContact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newContact.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Basic phone validation if provided
    if (newContact.phone && !/^[\d\s\-\(\)\+]{10,}$/.test(newContact.phone.replace(/\D/g, ''))) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('customer_service_requests')
        .insert({
          order_id: order.id,
          request_type: 'contact_update',
          requested_by_email: order.customer_email,
          requested_by_name: order.customer_name,
          request_data: {
            new_contact: newContact,
            current_contact: {
              email: order.customer_email,
              phone: order.customer_phone,
              name: order.customer_name
            }
          },
          customer_notes: customerNotes
        });

      if (error) throw error;

      toast.success("Contact update request submitted! We'll verify the changes and update your account.");
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setNewContact({
        email: "",
        phone: "",
        name: ""
      });
      setCustomerNotes("");
    } catch (error) {
      console.error('Error submitting contact update request:', error);
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
            <Phone className="h-5 w-5 text-primary" />
            Update Contact Information
          </DialogTitle>
          <DialogDescription>
            Update your contact details. We'll verify changes before updating your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Contact Info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">Current Contact Information:</div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {order.customer_email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {order.customer_phone || 'Not provided'}
              </div>
              <div>Name: {order.customer_name}</div>
            </div>
          </div>

          {/* New Contact Form */}
          <div className="space-y-3">
            <h4 className="font-medium">New Contact Information</h4>
            <p className="text-sm text-muted-foreground">Only fill in the fields you want to update.</p>
            
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email Address</Label>
              <Input
                id="newEmail"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                placeholder="newemail@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPhone">New Phone Number</Label>
              <Input
                id="newPhone"
                type="tel"
                value={newContact.phone}
                onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newName">New Name</Label>
              <Input
                id="newName"
                value={newContact.name}
                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Warning Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Email changes will require verification. You'll continue to receive notifications at your current email until the change is confirmed.
            </AlertDescription>
          </Alert>

          {/* Customer Notes */}
          <div className="space-y-2">
            <Label>Reason for Change (Optional)</Label>
            <Textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Why are you updating your contact information?"
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
              disabled={isLoading || (!newContact.email && !newContact.phone && !newContact.name)}
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