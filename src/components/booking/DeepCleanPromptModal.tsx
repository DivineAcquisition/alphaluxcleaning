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
import { Sparkles, CheckCircle } from 'lucide-react';

interface DeepCleanPromptModalProps {
  open: boolean;
  onClose: () => void;
  onSelectBundle: () => void;
  onSelect20Percent: () => void;
  frequency: string;
}

export function DeepCleanPromptModal({
  open,
  onClose,
  onSelectBundle,
  onSelect20Percent,
  frequency
}: DeepCleanPromptModalProps) {
  const [lastClean, setLastClean] = React.useState<string | null>(null);

  const showRecommendation = lastClean === 'OVER_2M' || lastClean === 'UNSURE';

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

            {/* Bundle Option */}
            <div className="border-2 border-[#ECC98B] rounded-lg p-6 space-y-4 bg-gradient-to-br from-[#ECC98B]/5 to-transparent">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#ECC98B]" />
                    <h3 className="font-bold text-lg">Bundle & Save: 30% OFF Deep Clean</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Keep {frequency === 'weekly' ? 'Weekly' : 'Bi-Weekly'} for 2 months and we'll issue your code today (valid 90 days).
                  </p>
                  <div className="space-y-1 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Receive code immediately in your booking flow</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Redeem anytime within 90 days</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Save 30% on your next Deep Clean</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-[#ECC98B] text-[#ECC98B]-foreground hover:bg-[#ECC98B]/80 whitespace-nowrap">
                  Best Value
                </Badge>
              </div>
              <Button
                onClick={onSelectBundle}
                className="w-full bg-[#ECC98B] hover:bg-[#ECC98B]/90 text-[#ECC98B]-foreground"
                size="lg"
              >
                Choose Bundle & Save 30% on Deep Clean Later
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