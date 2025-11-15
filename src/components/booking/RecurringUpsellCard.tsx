import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, TrendingDown, TrendingUp } from "lucide-react";

interface RecurringUpsellCardProps {
  oneTimePrice: number;
  biWeeklyPrice: number;
  monthlyPrice: number;
  onSelectOneTime: () => void;
  onSelectBiWeekly: () => void;
  onSelectMonthly: () => void;
  selectedFrequency: string;
}

export function RecurringUpsellCard({ oneTimePrice, biWeeklyPrice, monthlyPrice, onSelectOneTime, onSelectBiWeekly, onSelectMonthly, selectedFrequency }: RecurringUpsellCardProps) {
  const monthlySavings = oneTimePrice - monthlyPrice;
  const biWeeklySavings = oneTimePrice - biWeeklyPrice;
  const monthlyAnnualSavings = monthlySavings * 12;
  const biWeeklyAnnualSavings = biWeeklySavings * 24;

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      {/* Selection confirmation banner */}
      {selectedFrequency === 'monthly' && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">
              Monthly Membership Selected - Saving ${monthlySavings} per visit!
            </span>
          </div>
        </div>
      )}
      
      {selectedFrequency === 'bi_weekly' && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">
              Bi-Weekly Membership Selected - Saving ${biWeeklySavings} per visit!
            </span>
          </div>
        </div>
      )}
      
      <div className="flex items-start gap-2 mb-4">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Zap className="h-4 w-4 text-primary" /></div>
        <div>
          <h3 className="text-lg font-bold mb-0.5">💡 Choose Your Membership Plan</h3>
          <p className="text-xs text-muted-foreground">More frequent cleanings = bigger savings</p>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${selectedFrequency === 'one_time' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={onSelectOneTime}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">One-Time</h4>
            {selectedFrequency === 'one_time' && <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center"><Check className="h-3 w-3 text-primary-foreground" /></div>}
          </div>
          <div className="text-xl font-bold mb-1">${oneTimePrice}</div>
          <p className="text-xs text-muted-foreground">No commitment</p>
        </div>
        
        <div className={`p-3 rounded-lg border-2 transition-all cursor-pointer relative ${selectedFrequency === 'bi_weekly' ? 'border-blue-500 bg-blue-500/5' : 'border-border hover:border-blue-500/50'}`} onClick={onSelectBiWeekly}>
          <Badge className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-xs py-0">Popular</Badge>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Bi-Weekly</h4>
            {selectedFrequency === 'bi_weekly' && <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>}
          </div>
          <div className="text-xl font-bold mb-1">${biWeeklyPrice}</div>
          <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mb-1"><TrendingDown className="h-3 w-3" /><span>Save ${biWeeklySavings}</span></div>
          <p className="text-xs text-muted-foreground">2x/month • 3-mo minimum</p>
        </div>
        
        <div className={`p-3 rounded-lg border-2 transition-all cursor-pointer relative ${selectedFrequency === 'monthly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={onSelectMonthly}>
          <Badge className="absolute -top-1.5 -right-1.5 bg-primary text-xs py-0">Flexible</Badge>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Monthly</h4>
            {selectedFrequency === 'monthly' && <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center"><Check className="h-3 w-3 text-primary-foreground" /></div>}
          </div>
          <div className="text-xl font-bold mb-1">${monthlyPrice}</div>
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mb-1"><TrendingDown className="h-3 w-3" /><span>Save ${monthlySavings}</span></div>
          <p className="text-xs text-muted-foreground">1x/month • 3-mo minimum</p>
        </div>
      </div>
      <div className="space-y-1.5 bg-background/50 rounded-lg p-3">
        <div className="flex items-center gap-2 text-xs"><Check className="h-3 w-3 text-primary" /><span>Same cleaner, same day/time</span></div>
        <div className="flex items-center gap-2 text-xs"><Check className="h-3 w-3 text-primary" /><span>Priority rescheduling</span></div>
        <div className="flex items-center gap-2 text-xs"><Check className="h-3 w-3 text-primary" /><span>Cancel after 3 months</span></div>
      </div>
      {selectedFrequency === 'monthly' && monthlyAnnualSavings > 0 && (
        <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <TrendingUp className="h-3 w-3" />
            <span className="text-xs font-medium">Save ${Math.round(monthlyAnnualSavings)}/year with monthly visits</span>
          </div>
        </div>
      )}
      
      {selectedFrequency === 'bi_weekly' && biWeeklyAnnualSavings > 0 && (
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <TrendingUp className="h-3 w-3" />
            <span className="text-xs font-medium">Save ${Math.round(biWeeklyAnnualSavings)}/year with bi-weekly visits</span>
          </div>
        </div>
      )}
    </Card>
  );
}
