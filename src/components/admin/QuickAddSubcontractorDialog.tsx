
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface QuickAddSubcontractorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  ssn: string;
  tier_level: number;
}

const TIER_OPTIONS = [
  { value: 1, label: "Tier 1 - Standard ($14/hr)", rate: 14 },
  { value: 2, label: "Tier 2 - Professional ($16/hr)", rate: 16 },
  { value: 3, label: "Tier 3 - Elite ($18/hr)", rate: 18 },
  { value: 4, label: "Tier 4 - Premium ($20/hr)", rate: 20 },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export function QuickAddSubcontractorDialog({
  open,
  onOpenChange,
  onSuccess,
}: QuickAddSubcontractorDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "CA",
    zip_code: "",
    ssn: "",
    tier_level: 1,
  });
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phoneRegex.test(phone);
  };

  const validateSSN = (ssn: string) => {
    const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
    return ssnRegex.test(ssn);
  };

  const validateZip = (zip: string) => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zip);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation
    if (!formData.full_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name is required",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(formData.email)) {
      toast({
        title: "Validation Error", 
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhone(formData.phone)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid phone number (e.g., 555-123-4567)",
        variant: "destructive",
      });
      return;
    }

    if (!formData.address.trim()) {
      toast({
        title: "Validation Error",
        description: "Street address is required", 
        variant: "destructive",
      });
      return;
    }

    if (!formData.city.trim()) {
      toast({
        title: "Validation Error",
        description: "City is required", 
        variant: "destructive",
      });
      return;
    }

    if (!validateZip(formData.zip_code)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid ZIP code (e.g., 12345 or 12345-6789)", 
        variant: "destructive",
      });
      return;
    }

    if (!validateSSN(formData.ssn)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid SSN (XXX-XX-XXXX)", 
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-subcontractor-direct', {
        body: formData,
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Success!",
        description: `${formData.full_name} has been added and will receive onboarding instructions via email.`,
      });

      // Reset form
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "CA",
        zip_code: "",
        ssn: "",
        tier_level: 1,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating subcontractor:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create subcontractor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Subcontractor</DialogTitle>
            <DialogDescription>
              Create a new subcontractor profile with complete information and onboarding.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                placeholder="Enter full name"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="555-123-4567"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ssn">SSN *</Label>
              <Input
                id="ssn"
                type="password"
                value={formData.ssn}
                onChange={(e) => handleInputChange("ssn", e.target.value)}
                placeholder="XXX-XX-XXXX"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter street address"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Enter city"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => handleInputChange("state", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip_code">ZIP Code *</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => handleInputChange("zip_code", e.target.value)}
                placeholder="12345"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier_level">Hourly Tier *</Label>
              <Select
                value={formData.tier_level.toString()}
                onValueChange={(value) => handleInputChange("tier_level", parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tier level" />
                </SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map((tier) => (
                    <SelectItem key={tier.value} value={tier.value.toString()}>
                      {tier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Subcontractor & Send Onboarding Email
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
