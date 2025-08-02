import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle } from 'lucide-react';

interface TermsOfServiceAgreementProps {
  onAgreementChange: (agreed: boolean) => void;
  isAgreed: boolean;
  membershipSelected?: boolean;
}

export const TermsOfServiceAgreement: React.FC<TermsOfServiceAgreementProps> = ({ 
  onAgreementChange, 
  isAgreed,
  membershipSelected = false 
}) => {
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Terms of Service Agreement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-64 w-full border rounded-lg p-4 bg-muted/30">
          <div className="space-y-4 text-sm leading-relaxed">
            <p className="font-medium">
              By booking a service with Bay Area Cleaning Pros, you agree to the following terms:
            </p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  Time-Based Services
                </h4>
                <p className="text-muted-foreground">
                  All bookings are based on the selected time duration (2, 4, or 6 hours) and include a team of professional cleaners (2 cleaners for 2-4 hour services, 3 cleaners for 6-hour services). If your cleaning requires additional time, we will notify you before proceeding. Extra time is billed in 30-minute increments at $50/hour per cleaner and must be approved prior to continuation.
                </p>
              </div>

              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  Service Scope
                </h4>
                <p className="text-muted-foreground">
                  We clean according to the time purchased. If a full-home clean cannot be completed in the time selected, cleaners will prioritize based on your initial instructions. Deep cleaning, pet hair removal, wall washing, and other specialized tasks require proper add-ons.
                </p>
              </div>

              {membershipSelected && (
                <div>
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    BACP Club™ Membership Terms
                  </h4>
                  <p className="text-muted-foreground">
                    By selecting the BACP Club™ Membership, you agree to be billed $30/month on a recurring basis until canceled. A $20 discount is applied to each cleaning while the membership is active. You may cancel anytime from your customer portal or by contacting support. Credits roll over for 1 month and expire thereafter.
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  Cancellation & Rescheduling
                </h4>
                <p className="text-muted-foreground">
                  To avoid a cancellation fee, you must cancel or reschedule your appointment at least 24 hours before the scheduled time. Late cancellations or missed appointments may be subject to a fee of up to 50% of the booking cost.
                </p>
              </div>

              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  Access to Property
                </h4>
                <p className="text-muted-foreground">
                  You are responsible for ensuring our cleaners can access your property at the scheduled time. If we cannot access the home within 15 minutes of arrival, the appointment may be canceled and a fee may apply.
                </p>
              </div>

              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  Refunds
                </h4>
                <p className="text-muted-foreground">
                  All bookings are non-refundable once services are rendered. If you're dissatisfied, please contact us within 24 hours so we can resolve the issue.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <div className="flex items-start space-x-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <Checkbox
            id="terms-agreement"
            checked={isAgreed}
            onCheckedChange={onAgreementChange}
            className="mt-1"
          />
          <label 
            htmlFor="terms-agreement" 
            className="text-sm font-medium leading-relaxed cursor-pointer"
          >
            By checking this box, I agree to the Terms of Service and understand the time-based nature of the service{membershipSelected ? ', membership billing,' : ''} and cancellation policy.
          </label>
        </div>
        
        {!isAgreed && (
          <p className="text-xs text-muted-foreground text-center">
            You must agree to the Terms of Service to continue with your booking.
          </p>
        )}
      </CardContent>
    </Card>
  );
};