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
import { US_STATES } from "@/lib/states";

const ServiceDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

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
    // Check if user is admin first
    checkAdminAccess();
  }, [sessionId, orderId, navigate]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userRole } = await supabase.rpc('get_user_role', {
          _user_id: user.id
        });
        
        if (userRole === 'admin') {
          // Admin can access without session ID - use mock data
          setFormData(prev => ({
            ...prev,
            customerName: "Admin Preview User",
            customerEmail: "admin@alphaluxclean.com",
            customerPhone: "(857) 754-4557",
            streetAddress: "123 Admin Street",
            city: "New York",
            state: "CA",
            zipCode: "94102",
            flooringTypes: ["hardwood", "carpet"],
            primaryFlooringType: "hardwood",
            dwellingType: "house"
          }));
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.log("Not admin, checking session ID");
    }

    // If not admin and no session/order ID, show error but don't redirect
    if (!sessionId && !orderId) {
      toast.error("No session or order ID found.");
      setLoading(false);
      return;
    }
    fetchOrderDetails();
  };

  const fetchOrderDetails = async () => {
    try {
      const identifier = sessionId || orderId;
      const identifierType = sessionId ? 'stripe_session_id' : 'id';
      setLoading(true);
      console.log('Fetching order details with:', { sessionId, orderId });

      const { data, error } = await supabase.functions.invoke('get-order-details', {
        body: { session_id: sessionId, order_id: orderId }
      });

      if (error || !data?.order) {
        toast.error("Order not found");
        setLoading(false);
        return;
      }

      const fetched = data.order;
      console.log('Order data found:', fetched);

      // Autofill customer info
      setFormData(prev => ({
        ...prev,
        customerName: fetched.customer_name || "",
        customerEmail: fetched.customer_email || "",
        customerPhone: fetched.customer_phone || "",
      }));

      // Autofill service address if available
      if (fetched.service_details && typeof fetched.service_details === 'object') {
        const serviceDetails = fetched.service_details as any;
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
      // Check if admin preview mode
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userRole } = await supabase.rpc('get_user_role', {
          _user_id: user.id
        });
        
        if (userRole === 'admin' && !sessionId) {
          toast.success("Admin preview: Service details saved!");
          navigate('/schedule-service?admin_preview=true');
          return;
        }
      }

      const updatedServiceDetails = {
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

      const { data, error } = await supabase.functions.invoke('update-order-details', {
        body: {
          session_id: sessionId,
          order_id: orderId,
          service_details: updatedServiceDetails,
          customer_email: formData.customerEmail,
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
        }
      });

      if (error) throw error;
      toast.success("Service details saved successfully!");
      const scheduleParam = sessionId ? `session_id=${sessionId}` : `order_id=${orderId}`;
      navigate(`/schedule-service?${scheduleParam}`);
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
      
      <div className="container mx-auto px-4 py-6 lg:py-8 xl:py-12 2xl:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 xl:gap-12 2xl:gap-16">
            
            {/* Desktop Sidebar - Progress & Summary */}
            <div className="xl:col-span-3 space-y-6">
              <Card className="border-0 shadow-lg sticky top-6">
                <CardHeader className="bg-gradient-to-r from-primary to-accent text-white">
                  <CardTitle className="flex items-center gap-2 text-lg xl:text-xl">
                    <CheckCircle className="h-5 w-5 xl:h-6 xl:w-6" />
                    Progress
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/80">
                    {calculateCompletion()}% Complete
                  </CardDescription>
                  
                  {/* Enhanced Progress Bar */}
                  <div className="mt-4 space-y-3">
                    <div className="w-full bg-primary-foreground/20 rounded-full h-3">
                      <div 
                        className="bg-white h-3 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${calculateCompletion()}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-primary-foreground/90">
                      <span>Keep going!</span>
                      <span className="flex items-center gap-1 font-medium">
                        {calculateCompletion() === 100 && <CheckCircle className="h-4 w-4" />}
                        {calculateCompletion()}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 lg:p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Customer Info</span>
                      <span className={formData.customerName && formData.customerEmail ? "text-success" : "text-muted-foreground"}>
                        {formData.customerName && formData.customerEmail ? "✓" : "○"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Service Address</span>
                      <span className={formData.streetAddress && formData.city && formData.zipCode ? "text-success" : "text-muted-foreground"}>
                        {formData.streetAddress && formData.city && formData.zipCode ? "✓" : "○"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Property Details</span>
                      <span className={formData.dwellingType && formData.flooringTypes.length > 0 ? "text-success" : "text-muted-foreground"}>
                        {formData.dwellingType && formData.flooringTypes.length > 0 ? "✓" : "○"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Desktop Tips Card */}
              <Card className="border-0 shadow-lg hidden xl:block">
                <CardHeader>
                  <CardTitle className="text-lg">💡 Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3 text-sm text-muted-foreground">
                  <p>• More details help us provide better service</p>
                  <p>• All information is kept secure and private</p>
                  <p>• You can always update details later</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Form Content */}
            <div className="xl:col-span-9">
              {/* Desktop Header */}
              <Card className="border-0 shadow-lg mb-6 xl:mb-8">
                <CardHeader className="bg-gradient-to-r from-primary to-accent text-white p-6 lg:p-8">
                  <CardTitle className="flex items-center gap-3 text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl">
                    <Home className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 2xl:h-10 2xl:w-10" />
                    Complete Your Service Details
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/80 text-base lg:text-lg xl:text-xl 2xl:text-2xl">
                    Help us provide the best cleaning service by sharing a few more details
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Enhanced Form */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 lg:p-8 xl:p-10 2xl:p-12 space-y-8 lg:space-y-10 xl:space-y-12 2xl:space-y-16">
                  
                  {/* Enhanced Customer Information */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-semibold border-b pb-3">
                      <User className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 2xl:h-10 2xl:w-10 text-primary" />
                      Customer Information
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6 xl:gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="customerName" className="text-base font-medium">Full Name *</Label>
                        <Input
                          id="customerName"
                          value={formData.customerName}
                          onChange={(e) => handleInputChange("customerName", e.target.value)}
                          placeholder="John Doe"
                          required
                          className="h-12 text-base"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="customerEmail" className="text-base font-medium">Email Address *</Label>
                        <Input
                          id="customerEmail"
                          type="email"
                          value={formData.customerEmail}
                          onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                          placeholder="john@example.com"
                          required
                          className="h-12 text-base"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="customerPhone" className="text-base font-medium">Phone Number</Label>
                        <Input
                          id="customerPhone"
                          type="tel"
                          value={formData.customerPhone}
                          onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                          placeholder="(857) 754-4557"
                          className="h-12 text-base"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Service Address */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-semibold border-b pb-3">
                      <MapPin className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 2xl:h-10 2xl:w-10 text-primary" />
                      Service Address
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6 xl:gap-8">
                      <div className="md:col-span-2 xl:col-span-3 2xl:col-span-4 space-y-3">
                        <Label htmlFor="streetAddress" className="text-base font-medium">Street Address *</Label>
                        <Input
                          id="streetAddress"
                          value={formData.streetAddress}
                          onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                          placeholder="123 Main Street"
                          required
                          className="h-12 text-base"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="apartmentUnit" className="text-base font-medium">Apartment/Unit</Label>
                        <Input
                          id="apartmentUnit"
                          value={formData.apartmentUnit}
                          onChange={(e) => handleInputChange("apartmentUnit", e.target.value)}
                          placeholder="Apt 4B"
                          className="h-12 text-base"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="city" className="text-base font-medium">City *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                          placeholder="New York"
                          required
                          className="h-12 text-base"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="state" className="text-base font-medium">State</Label>
                        <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {US_STATES.map(state => (
                              <SelectItem key={state.abbreviation} value={state.abbreviation} className="text-base">
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="zipCode" className="text-base font-medium">ZIP Code *</Label>
                        <Input
                          id="zipCode"
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange("zipCode", e.target.value)}
                          placeholder="94102"
                          required
                          className="h-12 text-base"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Property Details */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-semibold border-b pb-3">
                      <Home className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 2xl:h-10 2xl:w-10 text-primary" />
                      Property Details
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6 xl:gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="dwellingType" className="text-base font-medium">Dwelling Type</Label>
                        <Select value={formData.dwellingType} onValueChange={(value) => handleInputChange("dwellingType", value)}>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Select dwelling type" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            <SelectItem value="apartment" className="text-base">Apartment</SelectItem>
                            <SelectItem value="house" className="text-base">House</SelectItem>
                            <SelectItem value="condo" className="text-base">Condo</SelectItem>
                            <SelectItem value="townhouse" className="text-base">Townhouse</SelectItem>
                            <SelectItem value="other" className="text-base">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="primaryFlooringType" className="text-base font-medium">Primary Flooring Type</Label>
                        <Select value={formData.primaryFlooringType} onValueChange={(value) => handleInputChange("primaryFlooringType", value)}>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Select primary flooring" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {flooringOptions.map((option) => (
                              <SelectItem key={option} value={option.toLowerCase()} className="text-base">
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Flooring Types Checkboxes */}
                    <div className="space-y-4">
                      <Label className="text-base font-medium">All Flooring Types Present *</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4">
                        {flooringOptions.map((option) => (
                          <div key={option} className="flex items-center space-x-3">
                            <Checkbox
                              id={`flooring-${option}`}
                              checked={formData.flooringTypes.includes(option.toLowerCase())}
                              onCheckedChange={(checked) => 
                                handleFlooringTypeChange(option.toLowerCase(), checked as boolean)
                              }
                              className="h-5 w-5"
                            />
                            <Label 
                              htmlFor={`flooring-${option}`} 
                              className="text-base font-normal cursor-pointer hover:text-primary transition-colors"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Additional Information */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-semibold border-b pb-3">
                      Additional Information
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 lg:gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="accessInstructions" className="text-base font-medium">Access Instructions</Label>
                        <Textarea
                          id="accessInstructions"
                          value={formData.accessInstructions}
                          onChange={(e) => handleInputChange("accessInstructions", e.target.value)}
                          placeholder="How should our team access your home?"
                          rows={4}
                          className="text-base resize-none"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="specialRequests" className="text-base font-medium">Special Requests</Label>
                        <Textarea
                          id="specialRequests"
                          value={formData.specialRequests}
                          onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                          placeholder="Any special cleaning requests or areas to focus on?"
                          rows={4}
                          className="text-base resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
                      <Checkbox
                        id="petsPresent"
                        checked={formData.petsPresent}
                        onCheckedChange={(checked) => handleInputChange("petsPresent", checked as boolean)}
                        className="h-5 w-5"
                      />
                      <Label htmlFor="petsPresent" className="text-base cursor-pointer">
                        Pets will be present during cleaning
                      </Label>
                    </div>
                  </div>

                  {/* Enhanced Navigation Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-between pt-8 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/payment-confirmation?session_id=${sessionId}`)}
                      className="flex items-center gap-2 h-12 lg:h-14 px-6 lg:px-8 text-base lg:text-lg hover:bg-muted/50 transition-all duration-200"
                    >
                      <ArrowLeft className="h-5 w-5 lg:h-6 lg:w-6" />
                      Back to Payment
                    </Button>
                    
                    <Button 
                      onClick={handleSubmit}
                      disabled={isSubmitting || calculateCompletion() < 80}
                      className="flex items-center gap-2 h-12 lg:h-14 px-8 lg:px-10 text-base lg:text-lg bg-primary hover:bg-primary/90 transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-5 w-5 lg:h-6 lg:w-6 border-b-2 border-white" />
                      ) : (
                        <>
                          Continue to Scheduling
                          <ArrowRight className="h-5 w-5 lg:h-6 lg:w-6" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;