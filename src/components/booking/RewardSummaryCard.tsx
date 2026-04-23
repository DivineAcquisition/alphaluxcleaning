import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, Copy, Check, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

interface RewardSummaryCardProps {
  rewardCode: string;
  expiryDate: Date;
  className?: string;
}

export function RewardSummaryCard({ rewardCode, expiryDate, className }: RewardSummaryCardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rewardCode);
      setCopied(true);
      toast.success('Reward code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  return (
    <Card className={`border-[#0F77CC]/30 bg-gradient-to-br from-[#0F77CC]/10 to-transparent shadow-lg ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-[#0F77CC]" />
          <CardTitle>Reward Unlocked</CardTitle>
          <Badge className="bg-[#0F77CC] text-[#0F77CC]-foreground hover:bg-[#0F77CC]/80 ml-auto">
            30% OFF
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Your Reward Code</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-background border-2 border-[#0F77CC]/50 rounded-lg px-4 py-3">
              <p className="text-xl font-mono font-bold text-center tracking-wider">
                {rewardCode}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="h-12 w-12 border-[#0F77CC]/50"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Valid until {format(expiryDate, 'MMMM dd, yyyy')}</span>
        </div>

        <div className="pt-2 border-t space-y-2">
          <p className="text-sm">
            <strong>Save this code or check your email.</strong> You can apply it to a Deep Clean within 90 days.
          </p>
          <p className="text-xs text-muted-foreground">
            This code gives you 30% off your next Deep Clean service. Cannot be combined with other offers.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}