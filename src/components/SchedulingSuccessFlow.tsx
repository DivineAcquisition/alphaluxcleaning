import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  MessageSquare, 
  ArrowRight,
  Download,
  Share2,
  Copy,
  CheckCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SchedulingSuccessFlowProps {
  scheduledDate: string;
  scheduledTime: string;
  orderId?: string;
  sessionId?: string;
  onContinue?: () => void;
}

const SchedulingSuccessFlow: React.FC<SchedulingSuccessFlowProps> = ({
  scheduledDate,
  scheduledTime,
  orderId,
  sessionId,
  onContinue
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCopied, setIsCopied] = useState(false);

  // Auto-advance through success steps
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < 3) {
        setCurrentStep(prev => prev + 1);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentStep]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCopyDetails = async () => {
    const details = `
AlphaLux Cleaning - Service Scheduled

📅 Date: ${formatDate(scheduledDate)}
⏰ Time: ${scheduledTime}
📋 Order ID: ${orderId || sessionId || 'N/A'}

We'll contact you within 2 hours to confirm availability.

Questions? Call (281) 809-9901
    `.trim();

    try {
      await navigator.clipboard.writeText(details);
      setIsCopied(true);
      toast.success('Details copied to clipboard!');
      setTimeout(() => setIsCopied(false), 3000);
    } catch (error) {
      toast.error('Failed to copy details');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AlphaLux Cleaning - Service Scheduled',
          text: `Service scheduled for ${formatDate(scheduledDate)} at ${scheduledTime}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyDetails();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Success Animation */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
        <CardContent className="p-8 text-center">
          <div className={cn(
            "mx-auto mb-6 transition-all duration-1000",
            currentStep >= 1 ? "animate-bounce" : "opacity-0"
          )}>
            <div className="relative">
              <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
              <div className="absolute inset-0 h-20 w-20 border-4 border-green-200 rounded-full animate-ping mx-auto" />
            </div>
          </div>

          <div className={cn(
            "transition-all duration-500",
            currentStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <h1 className="text-3xl font-bold text-green-800 mb-2">
              Request Submitted!
            </h1>
            <p className="text-green-700 text-lg mb-6">
              Your scheduling request has been received successfully
            </p>
          </div>

          {/* Step 2: Details */}
          <div className={cn(
            "transition-all duration-500 delay-1000",
            currentStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <span className="text-muted-foreground">Service Date:</span>
                </div>
                <span className="font-semibold">{formatDate(scheduledDate)}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <span className="text-muted-foreground">Service Time:</span>
                </div>
                <span className="font-semibold">{scheduledTime}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-muted-foreground">Reference ID:</span>
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  {orderId || sessionId || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Step 3: Next Steps */}
          <div className={cn(
            "transition-all duration-500 delay-2000",
            currentStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">What happens next?</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <p className="text-blue-700">We'll review your request and check availability</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <p className="text-blue-700">A team member will contact you within 2 hours</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <p className="text-blue-700">We'll confirm your appointment and send details</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {currentStep >= 3 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Quick Actions</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <Button
                variant="outline"
                onClick={handleCopyDetails}
                className="flex items-center gap-2 h-12"
              >
                {isCopied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {isCopied ? 'Copied!' : 'Copy Details'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2 h-12"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="flex items-center gap-2"
              >
                <a href="tel:+12818099901">
                  <Phone className="h-4 w-4" />
                  Call Us
                </a>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="flex items-center gap-2"
              >
                <a href="sms:+12818099901">
                  <MessageSquare className="h-4 w-4" />
                  Text Us
                </a>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="flex items-center gap-2"
              >
                <a href="mailto:info@alphaluxcleaning.com">
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t">
              <Button
                onClick={onContinue}
                className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                Continue to Order Status
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Contact */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-amber-800 text-sm">
              <span className="font-semibold">Need immediate assistance?</span>
              <br />
              Call our 24/7 hotline: 
              <Button variant="link" className="p-0 ml-1 h-auto text-sm font-bold text-amber-900" asChild>
                <a href="tel:+12818099901">(281) 809-9901</a>
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulingSuccessFlow;