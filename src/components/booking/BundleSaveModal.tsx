import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, TrendingUp, Sparkles } from 'lucide-react';

interface BundleSaveModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onContinue: () => void;
  standardPrice: number;
  bundlePrice: number;
  savings: number;
}

export function BundleSaveModal({
  open,
  onClose,
  onUpgrade,
  onContinue,
  standardPrice,
  bundlePrice,
  savings,
}: BundleSaveModalProps) {
  const [animatedSavings, setAnimatedSavings] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset and start animation
      setAnimatedSavings(0);
      setShowContent(false);
      
      // Delay content appearance
      const contentTimer = setTimeout(() => setShowContent(true), 100);
      
      // Animate savings counter
      const duration = 1500;
      const steps = 60;
      const increment = savings / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        setAnimatedSavings(Math.min(currentStep * increment, savings));
        
        if (currentStep >= steps) {
          clearInterval(interval);
        }
      }, duration / steps);

      return () => {
        clearTimeout(contentTimer);
        clearInterval(interval);
      };
    }
  }, [open, savings]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Limited Time Offer
            </Badge>
          </div>
          <DialogTitle className="text-2xl text-center">
            Bundle & Save Big!
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Upgrade to our 90-Day Plan and save on every visit
          </DialogDescription>
        </DialogHeader>

        <div className={`space-y-6 transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Savings Display */}
          <div className="bg-primary/5 rounded-lg p-6 text-center border-2 border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Your Total Savings</p>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-5xl font-bold text-primary animate-pulse">
                ${Math.round(animatedSavings)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              vs. booking 4 individual standard cleans
            </p>
          </div>

          {/* Comparison */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-foreground">One Standard Clean</p>
                <p className="text-sm text-muted-foreground">Single visit, regular price</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-foreground">${standardPrice}</p>
                <p className="text-xs text-muted-foreground">per visit</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border-2 border-primary/30 relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">90-Day Bundle Plan</p>
                <p className="text-sm text-muted-foreground">4 visits, deep + maintenance</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">${Math.round(bundlePrice / 4)}</p>
                <p className="text-xs text-muted-foreground">per visit</p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Bundle includes:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>1 Deep Clean + 3 Maintenance visits</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Priority scheduling & member support</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Locked-in pricing for 90 days</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>48-hour re-clean guarantee on every visit</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              size="lg"
              className="w-full text-lg hover-scale"
              onClick={onUpgrade}
            >
              Yes! Upgrade & Save ${Math.round(savings)}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="w-full"
              onClick={onContinue}
            >
              No thanks, continue with Standard Clean
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You can cancel or reschedule anytime with 48-hour notice
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
