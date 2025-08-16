import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Lock, 
  Shield, 
  Smartphone, 
  Zap,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StripePaymentForm } from './StripePaymentForm';
import { PaymentSecurityIndicator } from './PaymentSecurityIndicator';
import { MobilePaymentOptimizations } from './MobilePaymentOptimizations';
import { PaymentFormValidation } from './PaymentFormValidation';
import { usePaymentSecurity } from '@/hooks/usePaymentSecurity';
import { formatPrice, toDisplayAmount } from '@/lib/pricing-utils';

interface EnhancedPaymentInterfaceProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
  isSetupIntent?: boolean;
  customerData?: {
    email?: string;
    name?: string;
  };
  className?: string;
}

export function EnhancedPaymentInterface({
  amount,
  onSuccess,
  onCancel,
  isSetupIntent = false,
  customerData,
  className
}: EnhancedPaymentInterfaceProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'payment' | 'security' | 'validation'>('payment');
  const [paymentProgress, setPaymentProgress] = useState(0);
  
  const { 
    securityFeatures, 
    fraudIndicators, 
    analyzeFraudRisk,
    validatePaymentMethod 
  } = usePaymentSecurity();

  // Mock validation rules for demonstration
  const [validationRules, setValidationRules] = useState([
    {
      id: 'card_number',
      label: 'Card Number',
      description: 'Valid card number required',
      status: 'pending' as const,
      required: true
    },
    {
      id: 'expiry',
      label: 'Expiry Date',
      description: 'Valid expiry date required',
      status: 'pending' as const,
      required: true
    },
    {
      id: 'cvv',
      label: 'CVV',
      description: 'Security code verification',
      status: 'pending' as const,
      required: true
    },
    {
      id: 'billing',
      label: 'Billing Address',
      description: 'Address verification',
      status: 'pending' as const,
      required: false
    }
  ]);

  // Run fraud analysis on component mount
  useEffect(() => {
    analyzeFraudRisk();
  }, [analyzeFraudRisk]);

  // Auto-switch to mobile optimization if on mobile
  useEffect(() => {
    if (securityFeatures.deviceType === 'mobile' && activeTab === 'security') {
      setActiveTab('payment');
    }
  }, [securityFeatures.deviceType, activeTab]);

  const handleQuickPaySelect = (method: 'apple_pay' | 'google_pay' | 'card') => {
    // Switch to main payment form and pre-select method
    setActiveTab('payment');
    // This would be handled by the PaymentElement configuration
  };

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore <= 20) return 'bg-success/10 text-success border-success/20';
    if (riskScore <= 50) return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore <= 20) return 'Low Risk';
    if (riskScore <= 50) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Mobile-first quick payment options */}
      {securityFeatures.deviceType === 'mobile' && (
        <MobilePaymentOptimizations
          onQuickPaySelect={handleQuickPaySelect}
          isSupported={{
            applePay: securityFeatures.isApplePaySupported,
            googlePay: securityFeatures.isGooglePaySupported,
            webAuthn: securityFeatures.isWebAuthnSupported
          }}
        />
      )}

      {/* Security & fraud indicators */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Security Status</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs", getRiskBadgeColor(fraudIndicators.riskScore))}>
                {getRiskLabel(fraudIndicators.riskScore)}
              </Badge>
              
              {securityFeatures.hasSecureContext && (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="h-2 w-2 mr-1" />
                  Secure
                </Badge>
              )}
            </div>
          </div>

          {fraudIndicators.indicators.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              {fraudIndicators.indicators.join(', ')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced payment interface with tabs */}
      <Card className="shadow-clean">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span>Secure Payment</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {formatPrice(toDisplayAmount(amount))}
            </Badge>
          </CardTitle>
          
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Processing payment...</span>
                <span className="text-muted-foreground">{paymentProgress}%</span>
              </div>
              <Progress value={paymentProgress} className="h-2" />
            </div>
          )}
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="payment" className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                <span className="hidden sm:inline">Payment</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="validation" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span className="hidden sm:inline">Status</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="payment" className="space-y-0">
              <StripePaymentForm
                amount={amount}
                onSuccess={onSuccess}
                onCancel={onCancel}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                isSetupIntent={isSetupIntent}
                customerData={customerData}
              />
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <PaymentSecurityIndicator
                isWebAuthnSupported={securityFeatures.isWebAuthnSupported}
                deviceType={securityFeatures.deviceType === 'tablet' ? 'mobile' : securityFeatures.deviceType}
                paymentMethod="stripe"
              />
              
              {fraudIndicators.recommendations.length > 0 && (
                <Card className="bg-warning/5 border-warning/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning">Security Recommendations</p>
                        <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                          {fraudIndicators.recommendations.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="validation" className="space-y-4">
              <PaymentFormValidation
                validationRules={validationRules}
                cardBrand="visa"
                showStrength={true}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Performance indicators for mobile */}
      {securityFeatures.deviceType === 'mobile' && (
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>Mobile Optimized</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>~3 sec checkout</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}