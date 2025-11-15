import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, TrendingDown, TrendingUp } from "lucide-react";

interface RecurringUpsellCardProps {
  oneTimePrice: number;
  monthlyPrice: number;
  onSelectOneTime: () => void;
  onSelectMonthly: () => void;
  selectedFrequency: string;
}

export function RecurringUpsellCard({ oneTimePrice, monthlyPrice, onSelectOneTime, onSelectMonthly, selectedFrequency }: RecurringUpsellCardProps) {
  const savings = oneTimePrice - monthlyPrice;
  const annualSavings = savings * 12;

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-start gap-2 mb-4">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Zap className="h-4 w-4 text-primary" /></div>
        <div>
          <h3 className="text-lg font-bold mb-0.5">💡 Convert to Monthly Home Reset Membership</h3>
          <p className="text-xs text-muted-foreground">Lock in savings and enjoy priority service</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <div className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${selectedFrequency === 'one_time' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={onSelectOneTime}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">One-Time Clean</h4>
            {selectedFrequency === 'one_time' && <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center"><Check className="h-3 w-3 text-primary-foreground" /></div>}
          </div>
          <div className="text-xl font-bold mb-1">${oneTimePrice}</div>
          <p className="text-xs text-muted-foreground">Standard pricing</p>
        </div>
        <div className={`p-3 rounded-lg border-2 transition-all cursor-pointer relative ${selectedFrequency === 'monthly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={onSelectMonthly}>
          <Badge className="absolute -top-1.5 -right-1.5 bg-primary text-xs py-0">Best Value</Badge>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Monthly Membership</h4>
            {selectedFrequency === 'monthly' && <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center"><Check className="h-3 w-3 text-primary-foreground" /></div>}
          </div>
          <div className="text-xl font-bold mb-1">${monthlyPrice}</div>
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mb-1"><TrendingDown className="h-3 w-3" /><span>Save ${savings}</span></div>
          <p className="text-xs text-muted-foreground">Per visit • 3-month minimum</p>
        </div>
      </div>
      <div className="space-y-1.5 bg-background/50 rounded-lg p-3">
        <div className="flex items-center gap-2 text-xs"><Check className="h-3 w-3 text-primary" /><span>Same cleaner, same day/time</span></div>
        <div className="flex items-center gap-2 text-xs"><Check className="h-3 w-3 text-primary" /><span>Priority rescheduling</span></div>
        <div className="flex items-center gap-2 text-xs"><Check className="h-3 w-3 text-primary" /><span>Cancel after 3 months</span></div>
      </div>
      {annualSavings > 0 && <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"><div className="flex items-center gap-2 text-green-700 dark:text-green-400"><TrendingUp className="h-3 w-3" /><span className="text-xs font-medium">Save ${Math.round(annualSavings)}/year</span></div></div>}
    </Card>
  );
}
