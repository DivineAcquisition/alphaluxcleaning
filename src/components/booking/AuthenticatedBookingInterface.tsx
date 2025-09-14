import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, User, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ModernBookingFlow } from './ModernBookingFlow';

export function AuthenticatedBookingInterface() {
  const { user } = useAuth();

  // If user is authenticated, show the booking flow
  if (user) {
    return (
      <ModernBookingFlow 
        onComplete={() => {
          console.log('✅ Booking completed in AuthenticatedBookingInterface');
          // The navigation is handled in ModernBookingFlow's handleBookingComplete
        }}
      />
    );
  }

  // If not authenticated, show login requirement
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-primary/20">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Secure Booking Portal
              </CardTitle>
              <p className="text-muted-foreground">
                To ensure the security of your payment information and booking details, 
                please sign in or create an account to continue.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Security Benefits */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Why Sign In?</h3>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CreditCard className="w-3 h-3 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">Secure Payment Processing</p>
                      <p className="text-sm text-muted-foreground">
                        Your payment details are protected with enterprise-grade encryption
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3 h-3 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">Booking History & Management</p>
                      <p className="text-sm text-muted-foreground">
                        Track your services, reschedule, and manage preferences
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield className="w-3 h-3 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">Identity Verification</p>
                      <p className="text-sm text-muted-foreground">
                        Protects against fraud and ensures authorized bookings
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  asChild 
                  className="flex-1"
                  size="lg"
                >
                  <a href="/auth?mode=signin">
                    Sign In
                  </a>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="flex-1"
                  size="lg"
                >
                  <a href="/auth?mode=signup">
                    Create Account
                  </a>
                </Button>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Already have an account? <a href="/auth?mode=signin" className="text-primary hover:underline">Sign in here</a></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}