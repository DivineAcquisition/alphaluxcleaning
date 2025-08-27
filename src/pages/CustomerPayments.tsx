import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, CreditCard, Calendar, MapPin, DollarSign, AlertTriangle, ArrowLeft } from 'lucide-react';
import { EmailPortalAccess } from '@/components/customer/EmailPortalAccess';
import { useCustomerDataByEmail } from '@/hooks/useCustomerDataByEmail';
import { CustomStripePayment } from '@/components/payment/CustomStripePayment';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PaymentData {
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  cleaningType?: string;
  frequency?: string;
  squareFootage?: number;
  addOns?: string[];
  bedrooms?: number;
  bathrooms?: number;
  serviceAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  paymentType?: string;
}

export default function CustomerPayments() {
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();
  
  const {
    loading,
    orders,
    error,
    hasData,
    fetchCustomerData
  } = useCustomerDataByEmail(customerEmail);

  // Filter orders that require payment
  const unpaidOrders = orders.filter(order => 
    order.status === 'pending' || 
    order.status === 'pay_after_service' || 
    !order.status ||
    (order.service_status && order.service_status === 'pending_payment')
  );

  const totalAmountDue = unpaidOrders.reduce((sum, order) => sum + (order.amount || 0), 0);

  const handleEmailSubmit = async (email: string) => {
    setCustomerEmail(email);
  };

  const handlePayNow = (order: any) => {
    setSelectedOrder(order);
    setShowPayment(true);
  };

  const handlePaymentSuccess = (orderId: string) => {
    toast({
      title: "Payment Successful!",
      description: "Your payment has been processed successfully.",
    });
    setShowPayment(false);
    setSelectedOrder(null);
    // Refresh data to get updated payment status
    if (customerEmail) {
      fetchCustomerData(customerEmail);
    }
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setSelectedOrder(null);
  };

  const handleBackToServices = () => {
    setShowPayment(false);
    setSelectedOrder(null);
  };

  // If no email is set, show email entry form
  if (!customerEmail) {
    return (
      <EmailPortalAccess 
        onEmailSubmit={handleEmailSubmit}
        loading={loading}
        error={error}
      />
    );
  }

  // If email is set but no data found, show error state
  if (customerEmail && !loading && !hasData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No service records found for this email address. Please check your email or contact support.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => setCustomerEmail(null)} 
              variant="outline" 
              className="w-full mt-4"
            >
              Try Different Email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your services...</p>
        </div>
      </div>
    );
  }

  // Show payment form if an order is selected
  if (showPayment && selectedOrder) {
    const paymentData: PaymentData = {
      amount: selectedOrder.amount,
      customerEmail: selectedOrder.customer_email || customerEmail,
      customerName: selectedOrder.customer_name || 'Valued Customer',
      customerPhone: selectedOrder.customer_phone,
      cleaningType: selectedOrder.cleaning_type,
      frequency: selectedOrder.frequency,
      squareFootage: selectedOrder.service_details?.square_footage,
      addOns: selectedOrder.add_ons,
      serviceAddress: selectedOrder.service_details?.service_address,
      city: selectedOrder.service_details?.city,
      state: selectedOrder.service_details?.state,
      zipCode: selectedOrder.service_details?.zip_code,
      paymentType: 'one-time'
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button 
              onClick={handleBackToServices} 
              variant="outline" 
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Services
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Service Payment</CardTitle>
                <CardDescription>
                  Complete payment for your cleaning service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span>Service Type</span>
                    <span>{selectedOrder.cleaning_type}</span>
                  </div>
                  {selectedOrder.scheduled_date && (
                    <div className="flex justify-between text-sm">
                      <span>Service Date</span>
                      <span>{format(new Date(selectedOrder.scheduled_date), 'PPP')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount</span>
                    <span>${selectedOrder.amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <CustomStripePayment
            paymentData={paymentData}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </div>
      </div>
    );
  }

  // Main payment portal view
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Payment Portal</CardTitle>
            <CardDescription>
              Complete payments for your cleaning services
            </CardDescription>
            <div className="text-sm text-muted-foreground mt-2">
              Account: {customerEmail}
              <Button 
                onClick={() => setCustomerEmail(null)} 
                variant="link" 
                size="sm" 
                className="ml-2 h-auto p-0"
              >
                Change Email
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Payment Summary */}
        {unpaidOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount Due:</span>
                <span className="text-2xl">${totalAmountDue.toFixed(2)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {unpaidOrders.length} service{unpaidOrders.length !== 1 ? 's' : ''} require{unpaidOrders.length === 1 ? 's' : ''} payment
              </p>
            </CardContent>
          </Card>
        )}

        {/* Services Requiring Payment */}
        {unpaidOrders.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Services Requiring Payment</h3>
            {unpaidOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{order.cleaning_type || 'Cleaning Service'}</h4>
                        <Badge variant="outline">{order.frequency || 'One-time'}</Badge>
                        <Badge variant="destructive">Payment Required</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        {order.scheduled_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(order.scheduled_date), 'PPP')}</span>
                          </div>
                        )}
                        {order.service_details?.service_address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{order.service_details.service_address}</span>
                          </div>
                        )}
                      </div>

                      {order.add_ons && order.add_ons.length > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Add-ons: </span>
                          <span>{order.add_ons.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:items-end gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold">${order.amount.toFixed(2)}</div>
                        {order.scheduled_time && (
                          <div className="text-sm text-muted-foreground">{order.scheduled_time}</div>
                        )}
                      </div>
                      
                      <Button 
                        onClick={() => handlePayNow(order)}
                        className="w-full sm:w-auto"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* No unpaid services */
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Payments Complete</h3>
              <p className="text-muted-foreground">
                Great news! All your services have been paid for. No outstanding payments required.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Support Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h4 className="font-medium">Need Help?</h4>
              <p className="text-sm text-muted-foreground">
                Contact our support team at{' '}
                <a href="mailto:support@bayareacleaningprofessionals.com" className="text-primary hover:underline">
                  support@bayareacleaningprofessionals.com
                </a>
              </p>
              <p className="text-xs text-muted-foreground">
                Payments are processed securely via Stripe
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}