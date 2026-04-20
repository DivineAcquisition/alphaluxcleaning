import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { CheckCircle, Calendar, Clock, MapPin, Home, User, FileText, Mail, Phone, MessageSquare, Copy, Share2, CheckCheck, ExternalLink, Eye } from "lucide-react";
import { PostPaymentReferralSection } from "@/components/PostPaymentReferralSection";
import { toast } from "sonner";

export default function ConfirmationPreview() {
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);

  // Sample data for preview
  const orderDetails = {
    id: 'PREVIEW-12345',
    cleaning_type: 'deep_clean',
    frequency: 'weekly',
    square_footage: 1800,
    amount: 32500, // $325.00 in cents
    deposit_amount: 16250, // $162.50 in cents
    balance_due: 16250, // $162.50 in cents
    customer_name: 'Sarah Johnson',
    customer_email: 'sarah.johnson@example.com',
    customer_phone: '(857) 754-4557',
    scheduled_date: '2024-01-15',
    scheduled_time: '10:00 AM - 12:00 PM',
    service_details: {
      serviceAddress: {
        street: '123 Preview Street',
        apartment: 'Unit 2B',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105'
      },
      property: {
        dwellingType: 'apartment',
        flooringTypes: ['hardwood', 'tile'],
        primaryFlooringType: 'hardwood'
      },
      instructions: {
        access: 'Building code is 1234',
        parking: 'Visitor parking available',
        special: 'Please focus on kitchen and bathrooms',
        pets: true
      }
    }
  };

  const handleCopyDetails = async () => {
    const details = `
AlphaLux Cleaning - Booking Preview

📅 Service Date: ${new Date(orderDetails.scheduled_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}
⏰ Service Time: ${orderDetails.scheduled_time}
📋 Order ID: ${orderDetails.id}
💰 Amount: $${(orderDetails.amount / 100).toFixed(2)}

Customer: ${orderDetails.customer_name}
Email: ${orderDetails.customer_email}
Phone: ${orderDetails.customer_phone}

🎯 This is a preview of our confirmation experience!
Book your real service at: ${window.location.origin}

Questions? Call (281) 809-9901
    `.trim();

    try {
      await navigator.clipboard.writeText(details);
      setIsCopied(true);
      toast.success('Preview details copied to clipboard!');
      setTimeout(() => setIsCopied(false), 3000);
    } catch (error) {
      toast.error('Failed to copy details');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AlphaLux Cleaning - Preview Experience',
          text: `Check out our booking confirmation experience! Service scheduled for ${new Date(orderDetails.scheduled_date).toLocaleDateString()}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyDetails();
    }
  };

  const serviceDetails = orderDetails.service_details;
  const address = serviceDetails.serviceAddress;
  const property = serviceDetails.property;
  const instructions = serviceDetails.instructions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Preview Notice */}
          <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-primary">
                <Eye className="h-5 w-5" />
                <div className="flex-1">
                  <p className="font-semibold">Preview Mode</p>
                  <p className="text-sm text-muted-foreground">
                    This is a demonstration of our booking confirmation experience with sample data.
                  </p>
                </div>
                <Button onClick={() => navigate('/')} variant="outline" size="sm">
                  Book Real Service
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Success Header */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-green-800">Booking Confirmed!</h1>
                <p className="text-green-600 text-lg">
                  Your cleaning service has been successfully scheduled and payment has been received.
                </p>
                
                {/* Team Contact Notice */}
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">What's Next?</span>
                  </div>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p className="font-medium">🤝 One of our team members will reach out for confirmation</p>
                    <p>📧 Check your email for booking confirmation details</p>
                    <p>📱 Check your text messages for updates</p>
                  </div>
                </div>
                
                {/* Payment Status */}
                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">
                      {orderDetails.balance_due > 0 ? 'Deposit Paid' : 'Payment Complete'}
                    </span>
                  </div>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>Total Service Cost:</strong> ${(orderDetails.amount / 100).toFixed(2)}</p>
                    {orderDetails.deposit_amount && (
                      <p><strong>Amount Paid:</strong> ${(orderDetails.deposit_amount / 100).toFixed(2)}</p>
                    )}
                    {orderDetails.balance_due && orderDetails.balance_due > 0 && (
                      <>
                        <p><strong>Remaining Balance:</strong> ${(orderDetails.balance_due / 100).toFixed(2)}</p>
                        <p className="text-xs italic mt-2">Remaining balance will be collected after service completion.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Date & Time */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="h-6 w-6 text-primary" />
                Scheduled Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-6 rounded-lg space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-semibold text-blue-800">
                    {new Date(orderDetails.scheduled_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-semibold text-blue-800">
                    {orderDetails.scheduled_time}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-6 w-6 text-primary" />
                Order Summary
              </CardTitle>
              <CardDescription>Order ID: {orderDetails.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Service Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    Service Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Service Type:</strong> {orderDetails.cleaning_type?.replace(/_/g, ' ')}</p>
                    <p><strong>Frequency:</strong> {orderDetails.frequency?.replace(/_/g, ' ')}</p>
                    <p><strong>Square Footage:</strong> {orderDetails.square_footage} sq ft</p>
                    <p><strong>Property Type:</strong> {property?.dwellingType}</p>
                    <p><strong>Primary Flooring:</strong> {property?.primaryFlooringType}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Customer Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {orderDetails.customer_name}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {orderDetails.customer_email}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {orderDetails.customer_phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Address */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Service Address
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{address?.street}</p>
                  {address?.apartment && <p>{address.apartment}</p>}
                  <p>{address?.city}, {address?.state} {address?.zipCode}</p>
                </div>
              </div>

              {/* Special Instructions */}
              {instructions && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Special Instructions</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg space-y-2 text-sm">
                    {instructions.access && <p><strong>Access:</strong> {instructions.access}</p>}
                    {instructions.parking && <p><strong>Parking:</strong> {instructions.parking}</p>}
                    {instructions.special && <p><strong>Special Notes:</strong> {instructions.special}</p>}
                    {instructions.pets && <p><strong>Pets:</strong> Yes, pets on site</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  onClick={handleCopyDetails} 
                  variant="outline" 
                  className="w-full"
                >
                  {isCopied ? <CheckCheck className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {isCopied ? 'Copied!' : 'Copy Details'}
                </Button>
                
                <Button 
                  onClick={handleShare} 
                  variant="outline" 
                  className="w-full"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Preview
                </Button>
                
                <Button 
                  onClick={() => navigate('/')} 
                  variant="default" 
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Book Real Service
                </Button>
                
                <Button 
                  onClick={() => window.open('tel:(281) 809-9901')} 
                  variant="outline" 
                  className="w-full"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Us
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Real Booking CTA */}
          <Card className="border-2 border-primary bg-primary/5">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-primary mb-4">Ready to Experience This for Real?</h2>
              <p className="text-muted-foreground mb-6">
                This preview shows exactly what your confirmation experience will look like after booking.
                Schedule your cleaning service today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/')}>
                  Book Your Cleaning Service
                </Button>
                <Button size="lg" variant="outline" onClick={() => window.open('tel:(281) 809-9901')}>
                  Call (281) 809-9901
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* PostPaymentReferralSection */}
          <PostPaymentReferralSection />
        </div>
      </div>
    </div>
  );
}