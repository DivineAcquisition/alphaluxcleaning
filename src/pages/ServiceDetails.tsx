import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Navigation } from "@/components/Navigation";
import { MapPin, Home, User, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ServiceDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [formData, setFormData] = useState({
    // Service Address
    streetAddress: "",
    apartmentUnit: "",
    city: "",
    state: "",
    zipCode: "",
    
    // Property Details
    dwellingType: "",
    flooringTypes: [] as string[],
    primaryFlooringType: "",
    
    // Customer Information
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    
    // Contact Preferences
    contactMethod: "",
    contactTime: "",
    accessInstructions: "",
    parkingInstructions: "",
    specialRequests: "",
    petsPresent: false,
    alarmCode: "",
    
    // Marketing Source
    hearAboutUs: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      toast.error("No session ID found. Redirecting to home.");
      navigate('/');
      return;
    }
    fetchOrderDetails();
  }, [sessionId, navigate]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("stripe_session_id", sessionId)
        .single();

      if (error) {
        toast.error("Order not found");
        navigate('/');
        return;
      }

      // Autofill customer info
      setFormData(prev => ({
        ...prev,
        customerName: data.customer_name || "",
        customerEmail: data.customer_email || "",
        customerPhone: data.customer_phone || "",
      }));

      // Autofill service address if available
      if (data.service_details && typeof data.service_details === 'object') {
        const serviceDetails = data.service_details as any;
        const addr = serviceDetails.serviceAddress || serviceDetails.address;
        
        if (addr) {
          setFormData(prev => ({
            ...prev,
            streetAddress: addr.street || "",
            apartmentUnit: addr.apartment || "",
            city: addr.city || "",
            state: addr.state || "",
            zipCode: addr.zipCode || "",
          }));
        }

        // Autofill property details
        if (serviceDetails.property) {
          setFormData(prev => ({
            ...prev,
            dwellingType: serviceDetails.property.dwellingType || "",
            flooringTypes: Array.isArray(serviceDetails.property.flooringTypes) 
              ? serviceDetails.property.flooringTypes 
              : serviceDetails.property.flooringType 
                ? [serviceDetails.property.flooringType] 
                : [],
            primaryFlooringType: serviceDetails.property.primaryFlooringType || "",
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFlooringTypeChange = (flooringType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      flooringTypes: checked
        ? [...prev.flooringTypes, flooringType]
        : prev.flooringTypes.filter(type => type !== flooringType)
    }));
  };

  const calculateCompletion = () => {
    const requiredFields = ['streetAddress', 'city', 'zipCode', 'customerEmail', 'customerName'];
    const optionalFields = ['dwellingType', 'flooringTypes', 'primaryFlooringType'];
    
    const requiredComplete = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return Array.isArray(value) ? value.length > 0 : !!value;
    }).length;
    
    const optionalComplete = optionalFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return Array.isArray(value) ? value.length > 0 : !!value;
    }).length;
    
    const totalRequired = requiredFields.length;
    const totalOptional = optionalFields.length;
    
    return Math.round(((requiredComplete * 2 + optionalComplete) / (totalRequired * 2 + totalOptional)) * 100);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.streetAddress || !formData.city || !formData.zipCode) {
      toast.error("Please fill in all required address fields");
      return;
    }

    if (!formData.customerEmail || !formData.customerName) {
      toast.error("Please fill in your name and email");
      return;
    }

    if (formData.flooringTypes.length === 0) {
      toast.error("Please select at least one flooring type");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the complete order data
      const { data: orderData, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("stripe_session_id", sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Merge new service details with existing ones
      const existingServiceDetails = (orderData.service_details && typeof orderData.service_details === 'object') ? orderData.service_details : {};
      const updatedServiceDetails = {
        ...existingServiceDetails,
        serviceAddress: {
          street: formData.streetAddress,
          apartment: formData.apartmentUnit,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        property: {
          dwellingType: formData.dwellingType,
          flooringTypes: formData.flooringTypes,
          primaryFlooringType: formData.primaryFlooringType
        },
        source: formData.hearAboutUs,
        instructions: {
          access: formData.accessInstructions,
          parking: formData.parkingInstructions,
          special: formData.specialRequests,
          pets: formData.petsPresent,
          alarmCode: formData.alarmCode
        },
        contact: {
          method: formData.contactMethod,
          time: formData.contactTime
        }
      };

      // Update the order
      const { error } = await supabase
        .from("orders")
        .update({
          service_details: updatedServiceDetails,
          customer_email: formData.customerEmail,
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone
        })
        .eq("stripe_session_id", sessionId);

      if (error) throw error;

      toast.success("Service details saved successfully!");
      
      // Navigate to scheduling page
      navigate(`/schedule-service?session_id=${sessionId}`);
    } catch (error) {
      console.error("Error saving details:", error);
      toast.error("Failed to save details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading service details...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const flooringOptions = [
    "Hardwood",
    "Carpet",
    "Tile",
    "Laminate", 
    "Vinyl",
    "Marble",
    "Stone",
    "Linoleum",
    "Concrete",
    "Other"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary to-accent text-white">
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Complete Your Service Details
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Help us provide the best cleaning service by sharing a few more details
              </CardDescription>
              
              {/* Progress Bar */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Form Completion</span>
                  <span className="flex items-center gap-1">
                    {calculateCompletion() === 100 && <CheckCircle className="h-4 w-4" />}
                    {calculateCompletion()}%
                  </span>
                </div>
                <div className="w-full bg-primary-foreground/20 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${calculateCompletion()}%` }}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Form */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 space-y-8">
              
              {/* Customer Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <User className="h-5 w-5 text-primary" />
                  Customer Information
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange("customerName", e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Service Address */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <MapPin className="h-5 w-5 text-primary" />
                  Service Address
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="streetAddress">Street Address *</Label>
                    <Input
                      id="streetAddress"
                      value={formData.streetAddress}
                      onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                      placeholder="123 Main Street"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="apartmentUnit">Apartment/Unit</Label>
                    <Input
                      id="apartmentUnit"
                      value={formData.apartmentUnit}
                      onChange={(e) => handleInputChange("apartmentUnit", e.target.value)}
                      placeholder="Apt 4B"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="San Francisco"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange("zipCode", e.target.value)}
                      placeholder="94102"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Home className="h-5 w-5 text-primary" />
                  Property Details
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dwellingType">Dwelling Type</Label>
                    <Select value={formData.dwellingType} onValueChange={(value) => handleInputChange("dwellingType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dwelling type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="primaryFlooringType">Primary Flooring Type</Label>
                    <Select value={formData.primaryFlooringType} onValueChange={(value) => handleInputChange("primaryFlooringType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary flooring" />
                      </SelectTrigger>
                      <SelectContent>
                        {flooringOptions.map((option) => (
                          <SelectItem key={option} value={option.toLowerCase()}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Flooring Types Checkboxes */}
                <div className="space-y-3">
                  <Label>All Flooring Types Present *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {flooringOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`flooring-${option}`}
                          checked={formData.flooringTypes.includes(option.toLowerCase())}
                          onCheckedChange={(checked) => 
                            handleFlooringTypeChange(option.toLowerCase(), checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`flooring-${option}`} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <div className="text-lg font-semibold">Additional Information</div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accessInstructions">Access Instructions</Label>
                    <Textarea
                      id="accessInstructions"
                      value={formData.accessInstructions}
                      onChange={(e) => handleInputChange("accessInstructions", e.target.value)}
                      placeholder="How should our team access your home?"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialRequests">Special Requests</Label>
                    <Textarea
                      id="specialRequests"
                      value={formData.specialRequests}
                      onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                      placeholder="Any special cleaning requests or areas to focus on?"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="petsPresent"
                    checked={formData.petsPresent}
                    onCheckedChange={(checked) => handleInputChange("petsPresent", checked as boolean)}
                  />
                  <Label htmlFor="petsPresent">Pets will be present during cleaning</Label>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/payment-confirmation?session_id=${sessionId}`)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Payment
                </Button>
                
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || calculateCompletion() < 80}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      Continue to Scheduling
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;