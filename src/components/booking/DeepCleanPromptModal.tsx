import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle, Gift } from 'lucide-react';
import { calculateBundleSavings } from '@/lib/bundle-offers';

interface DeepCleanPromptModalProps {
  open: boolean;
  onClose: () => void;
  onSelectBundle: () => void;
  onSelect20Percent: () => void;
  frequency: string;
  recurringPrice?: number;
}

export function DeepCleanPromptModal({
  open,
  onClose,
  onSelectBundle,
  onSelect20Percent,
  frequency,
  recurringPrice = 150
}: DeepCleanPromptModalProps) {
  const [lastClean, setLastClean] = React.useState<string | null>(null);

  const showRecommendation = lastClean === 'OVER_2M' || lastClean === 'UNSURE';
  const bundleSavings = calculateBundleSavings(
    recurringPrice,
    frequency === 'weekly' ? 'weekly' : 'bi-weekly',
    3
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {!lastClean ? 'Quick Question' : 'We recommend a Deep Clean to reset your home'}
          </DialogTitle>
          {!lastClean && (
            <DialogDescription className="text-base">
              When was your home last professionally deep cleaned?
            </DialogDescription>
          )}
        </DialogHeader>

        {!lastClean ? (
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-center h-auto py-4 text-lg"
              onClick={() => setLastClean('WITHIN_2M')}
            >
              Within 2 months
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center h-auto py-4 text-lg"
              onClick={() => setLastClean('OVER_2M')}
            >
              Over 2 months ago
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center h-auto py-4 text-lg"
              onClick={() => setLastClean('UNSURE')}
            >
              Not sure
            </Button>
          </div>
        ) : showRecommendation ? (
          <div className="space-y-6 py-4">
            <p className="text-muted-foreground">
              Start your recurring plan on the right foot. Choose one of these:
            </p>

            {/* NEW: Enhanced Bundle Option */}
            <div className="border-2 border-primary rounded-lg p-6 space-y-4 bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-xs font-bold">
                Save ${bundleSavings.toFixed(0)}+
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xl">🎁 3-Month {frequency === 'weekly' ? 'Weekly' : 'Bi-Weekly'} Bundle</h3>
                  </div>
                  <p className="text-lg font-semibold text-primary">
                    Get 20% OFF Every Clean + FREE Deep Clean ($355 Value)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Commit to 3 months of {frequency === 'weekly' ? 'weekly' : 'bi-weekly'} service and unlock massive savings.
                  </p>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-3">
                    <p className="font-bold text-primary mb-2">Your Total Savings:</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">20% off {frequency === 'weekly' ? '~13' : '~6'} cleanings</span>
                        <span className="font-semibold">${(bundleSavings - 355).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">FREE Deep Clean</span>
                        <span className="font-semibold">$355</span>
                      </div>
                      <div className="border-t border-primary/20 pt-1 mt-1 flex justify-between">
                        <span className="font-bold">Total Savings</span>
                        <span className="font-bold text-primary text-lg">${bundleSavings.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="font-medium">Receive Deep Clean code instantly</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="font-medium">Redeem anytime within 90 days</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="font-medium">20% OFF automatically applied to each clean</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                onClick={onSelectBundle}
                className="w-full"
                size="lg"
              >
                Choose Bundle & Save ${bundleSavings.toFixed(0)}
              </Button>
            </div>

            {/* Simple 20% Option */}
            <div className="border rounded-lg p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="font-bold text-lg">Simple Start: 20% OFF Today</h3>
                <p className="text-sm text-muted-foreground">
                  Take 20% off your first clean now—no commitment.
                </p>
              </div>
              <Button
                onClick={onSelect20Percent}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Take 20% Off My First Clean
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-primary mx-auto" />
            <p className="text-muted-foreground">
              Great! Your home is in good shape. Proceed with your booking.
            </p>
            <Button onClick={onClose} className="w-full" size="lg">
              Continue
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}