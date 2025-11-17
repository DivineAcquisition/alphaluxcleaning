import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2, Phone, Mail, MapPin, Home, Calendar, CreditCard } from 'lucide-react';
import { InstantPaymentForm } from '@/components/ui/instant-payment-form';

const HOME_SIZE_RANGES = [
  { id: 'under_1000', label: 'Under 1,000 sq ft', sqft: 800 },
  { id: '1000_1499', label: '1,000-1,499 sq ft', sqft: 1250 },
  { id: '1500_1999', label: '1,500-1,999 sq ft', sqft: 1750 },
  { id: '2000_2499', label: '2,000-2,499 sq ft', sqft: 2250 },
  { id: '2500_2999', label: '2,500-2,999 sq ft', sqft: 2750 },
  { id: '3000_3499', label: '3,000-3,499 sq ft', sqft: 3250 },
  { id: '3500_3999', label: '3,500-3,999 sq ft', sqft: 3750 },
  { id: '4000_4999', label: '4,000-4,999 sq ft', sqft: 4500 },
  { id: '5000_plus', label: '5,000+ sq ft', sqft: 5500 },
];

const formSchema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone number required'),
  zipCode: z.string().min(5, 'ZIP code required'),
  addressLine1: z.string().min(5, 'Street address required'),
  addressLine2: z.string().optional(),
  bedrooms: z.string().min(1, 'Select bedrooms'),
  bathrooms: z.string().min(1, 'Select bathrooms'),
  sqftRange: z.string().min(1, 'Select square footage'),
  offerType: z.enum(['tester', '90_day'], { required_error: 'Select an offer' }),
  paymentMode: z.enum(['instant', 'link'], { required_error: 'Select payment mode' }),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  specialInstructions: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CSRBookingForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [pricing, setPricing] = useState({ total: 0, deposit: 0, balance: 0 });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMode: 'instant',
    },
  });

  const calculatePricing = (sqftRange: string, offerType: string) => {
    const range = HOME_SIZE_RANGES.find(r => r.id === sqftRange);
    if (!range) return { total: 0, deposit: 0, balance: 0 };

    let basePrice = 0;
    if (range.sqft < 1500) basePrice = offerType === 'tester' ? 199 : 549;
    else if (range.sqft < 2500) basePrice = offerType === 'tester' ? 249 : 649;
    else if (range.sqft < 4000) basePrice = offerType === 'tester' ? 299 : 749;
    else basePrice = offerType === 'tester' ? 349 : 849;

    const deposit = Math.round(basePrice * 0.25 * 100) / 100;
    const balance = Math.round((basePrice - deposit) * 100) / 100;

    return { total: basePrice, deposit, balance };
  };

  const watchSqft = form.watch('sqftRange');
  const watchOffer = form.watch('offerType');
  const watchPaymentMode = form.watch('paymentMode');

  // Update pricing when sqft or offer changes
  useState(() => {
    if (watchSqft && watchOffer) {
      const newPricing = calculatePricing(watchSqft, watchOffer);
      setPricing(newPricing);
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const pricingCalc = calculatePricing(data.sqftRange, data.offerType);
      
      // Create customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert({
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          address_line1: data.addressLine1,
          address_line2: data.addressLine2,
          postal_code: data.zipCode,
        })
        .select()
        .single();

      if (customerError) throw customerError;

      const offerDetails = data.offerType === 'tester' 
        ? { name: 'Tester Deep Clean', type: 'tester', visits: 1 }
        : { name: '90-Day Reset & Maintain Plan', type: '90_day_plan', visits: 4 };

      // Create booking
      const { data: bookingRecord, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: customerData.id,
          email: data.email,
          full_name: `${data.firstName} ${data.lastName}`,
          address_line1: data.addressLine1,
          address_line2: data.addressLine2,
          zip_code: data.zipCode,
          sqft_or_bedrooms: data.sqftRange,
          service_type: 'Deep Cleaning',
          frequency: data.offerType === 'tester' ? 'one-time' : 'recurring',
          est_price: pricingCalc.total,
          deposit_amount: pricingCalc.deposit,
          balance_due: pricingCalc.balance,
          offer_name: offerDetails.name,
          offer_type: offerDetails.type,
          visit_count: offerDetails.visits,
          is_recurring: data.offerType === '90_day',
          status: data.paymentMode === 'instant' ? 'pending' : 'payment_pending',
          payment_status: 'pending',
          source: 'csr_phone',
          created_by_user_id: user.id,
          preferred_date: data.preferredDate || null,
          preferred_time_block: data.preferredTime || null,
          special_instructions: data.specialInstructions || null,
          property_details: {
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            sqft_range: data.sqftRange,
          },
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      if (data.paymentMode === 'instant') {
        // Show payment form
        setBookingData({
          bookingId: bookingRecord.id,
          customerEmail: data.email,
          customerName: `${data.firstName} ${data.lastName}`,
          customerPhone: data.phone,
          paymentAmount: pricingCalc.deposit,
          fullAmount: pricingCalc.total,
        });
        setShowPaymentForm(true);
      } else {
        // Send payment link
        const { error: linkError } = await supabase.functions.invoke('send-payment-link', {
          body: {
            bookingId: bookingRecord.id,
            customerEmail: data.email,
            customerName: `${data.firstName} ${data.lastName}`,
            depositAmount: pricingCalc.deposit,
          },
        });

        if (linkError) throw linkError;

        toast.success('Booking created! Payment link sent to customer.');
        navigate('/admin/dashboard');
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    toast.success('Payment processed successfully!');
    navigate('/admin/dashboard');
  };

  if (showPaymentForm && bookingData) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Process Payment</CardTitle>
            <CardDescription>Collect payment over the phone</CardDescription>
          </CardHeader>
          <CardContent>
            <InstantPaymentForm
              paymentAmount={bookingData.paymentAmount}
              fullAmount={bookingData.fullAmount}
              paymentType="deposit"
              customerEmail={bookingData.customerEmail}
              customerName={bookingData.customerName}
              customerPhone={bookingData.customerPhone}
              bookingId={bookingData.bookingId}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentForm(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            CSR Phone Booking
          </CardTitle>
          <CardDescription>Create bookings for customers calling in</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Service Location */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Service Location
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code *</FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={5} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div />
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Home Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Home Details
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrooms *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['1', '2', '3', '4', '5', '6+'].map((num) => (
                              <SelectItem key={num} value={num}>{num}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bathrooms *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5+'].map((num) => (
                              <SelectItem key={num} value={num}>{num}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sqftRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Square Footage *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {HOME_SIZE_RANGES.map((range) => (
                              <SelectItem key={range.id} value={range.id}>
                                {range.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Offer Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Offer</h3>
                <FormField
                  control={form.control}
                  name="offerType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div>
                            <RadioGroupItem value="tester" id="tester" className="peer sr-only" />
                            <label
                              htmlFor="tester"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <div className="text-center">
                                <div className="font-semibold">Tester Deep Clean</div>
                                <div className="text-sm text-muted-foreground">Single visit</div>
                                {pricing.total > 0 && (
                                  <div className="mt-2 text-lg font-bold">${pricing.total}</div>
                                )}
                              </div>
                            </label>
                          </div>
                          <div>
                            <RadioGroupItem value="90_day" id="90_day" className="peer sr-only" />
                            <label
                              htmlFor="90_day"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <div className="text-center">
                                <div className="font-semibold">90-Day Plan</div>
                                <div className="text-sm text-muted-foreground">4 visits over 90 days</div>
                                {pricing.total > 0 && (
                                  <div className="mt-2 text-lg font-bold">${pricing.total}</div>
                                )}
                              </div>
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {pricing.total > 0 && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Total Price:</span>
                      <span className="font-semibold">${pricing.total}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Deposit (25%):</span>
                      <span className="font-semibold text-primary">${pricing.deposit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Balance Due After Service:</span>
                      <span className="font-semibold">${pricing.balance}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Scheduling */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Scheduling (Optional)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="preferredDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preferredTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Time</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="morning">Morning (8am-12pm)</SelectItem>
                            <SelectItem value="afternoon">Afternoon (12pm-4pm)</SelectItem>
                            <SelectItem value="evening">Evening (4pm-8pm)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specialInstructions"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Special Instructions</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Collection
                </h3>
                <FormField
                  control={form.control}
                  name="paymentMode"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div>
                            <RadioGroupItem value="instant" id="instant" className="peer sr-only" />
                            <label
                              htmlFor="instant"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <div className="text-center">
                                <div className="font-semibold">Collect Payment Now</div>
                                <div className="text-sm text-muted-foreground">Process card over phone</div>
                              </div>
                            </label>
                          </div>
                          <div>
                            <RadioGroupItem value="link" id="link" className="peer sr-only" />
                            <label
                              htmlFor="link"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <div className="text-center">
                                <div className="font-semibold">Send Payment Link</div>
                                <div className="text-sm text-muted-foreground">Email link to customer</div>
                              </div>
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {watchPaymentMode === 'instant' ? 'Proceed to Payment' : 'Create Booking & Send Link'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin/dashboard')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
