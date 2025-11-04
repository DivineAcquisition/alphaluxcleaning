import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Sparkles, TrendingDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useBooking } from '@/contexts/BookingContext';

interface RecurringUpsellCardProps {
  currentPrice: number;
  basePrice: number;
  onUpgrade: (frequency: string, startDate: string) => void;
  isOneTime: boolean;
  selectedDate?: string;
}

const FREQUENCY_OPTIONS = [
  { 
    id: 'weekly', 
    label: 'Weekly', 
    discount: 0.15,
    badge: 'Most Popular',
    perYear: 52,
    description: 'Perfect for busy families'
  },
  { 
    id: 'bi_weekly', 
    label: 'Bi-Weekly', 
    discount: 0.10,
    badge: 'Best Value',
    perYear: 26,
    description: 'Ideal for most homes'
  },
  { 
    id: 'monthly', 
    label: 'Monthly', 
    discount: 0.05,
    perYear: 12,
    description: 'Light maintenance'
  }
];

export function RecurringUpsellCard({ 
  currentPrice, 
  basePrice,
  onUpgrade,
  isOneTime,
  selectedDate 
}: RecurringUpsellCardProps) {
  const { bookingData, pricing } = useBooking();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState('bi_weekly');
  const [startDate, setStartDate] = useState<Date | undefined>(
    selectedDate ? new Date(selectedDate) : undefined
  );
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  if (!isOneTime) return null;

  const BONUS_DISCOUNT = 0.10;
  const selectedOption = FREQUENCY_OPTIONS.find(f => f.id === selectedFrequency)!;
  const totalDiscount = selectedOption.discount + BONUS_DISCOUNT;
  const newPrice = basePrice * (1 - totalDiscount);
  const savingsPerClean = currentPrice - newPrice;
  const annualSavings = savingsPerClean * selectedOption.perYear;
  const freeCleans = Math.floor(annualSavings / newPrice);

  const handleUpgrade = async () => {
    if (!startDate) return;
    
    setIsSendingWebhook(true);
    
    // Update booking context first
    onUpgrade(selectedFrequency, format(startDate, 'yyyy-MM-dd'));
    
    // Send webhook to track recurring upgrade
    try {
      console.log('🔄 Sending recurring upgrade webhook...');
      await supabase.functions.invoke('send-recurring-upgrade-webhook', {
        body: {
          booking_context_data: {
            ...bookingData,
            pricing: pricing, // Include current pricing object
            sqft: bookingData.sqft || 2000 // Ensure sqft is present
          },
          upgrade_details: {
            previous_frequency: 'one_time',
            new_frequency: selectedFrequency,
            recurring_start_date: format(startDate, 'yyyy-MM-dd'),
            additional_discount: BONUS_DISCOUNT,
            new_price_per_clean: newPrice,
            annual_savings: annualSavings
          }
        }
      });
      console.log('✅ Recurring upgrade webhook sent successfully');
    } catch (error) {
      console.error('❌ Recurring upgrade webhook failed:', error);
      // Don't block user flow if webhook fails
    } finally {
      setIsSendingWebhook(false);
    }
  };

  return (
    <Card className="relative overflow-hidden border-2 border-primary/50 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      {/* Hero Badge */}
      <div className="absolute top-4 right-4 z-10">
        <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 px-3 py-1">
          <Sparkles className="w-3 h-3 mr-1" />
          Extra 10% Off
        </Badge>
      </div>

      <div className="p-6 pt-8">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-2">
            💰 Switch to Recurring & Save Even More
          </h3>
          <p className="text-muted-foreground">
            Get an additional 10% discount when you upgrade to recurring service today
          </p>
        </div>

        {/* Toggle View */}
        {!isUpgrading ? (
          <div className="space-y-4">
            {/* Savings Preview */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">With Bi-Weekly Recurring</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                  20% Total Savings
                </Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-600">
                  ${Math.round(basePrice * 0.80)}
                </span>
                <span className="text-sm text-muted-foreground">per clean</span>
                <span className="text-lg text-muted-foreground line-through ml-auto">
                  ${Math.round(currentPrice)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Save ${Math.round(currentPrice - (basePrice * 0.80))} per clean • 
                ${Math.round((currentPrice - (basePrice * 0.80)) * 26)}/year total savings
              </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background p-3 rounded-lg border">
                <div className="text-xl font-bold text-primary">🎯</div>
                <div className="text-xs font-medium mt-1">Priority Scheduling</div>
              </div>
              <div className="bg-background p-3 rounded-lg border">
                <div className="text-xl font-bold text-primary">💎</div>
                <div className="text-xs font-medium mt-1">VIP Status</div>
              </div>
              <div className="bg-background p-3 rounded-lg border">
                <div className="text-xl font-bold text-primary">🔒</div>
                <div className="text-xs font-medium mt-1">Lock Today's Rate</div>
              </div>
              <div className="bg-background p-3 rounded-lg border">
                <div className="text-xl font-bold text-primary">📅</div>
                <div className="text-xs font-medium mt-1">Auto-Scheduled</div>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full"
              onClick={() => setIsUpgrading(true)}
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Yes! Switch to Recurring & Save
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Cancel anytime • No contracts • No hidden fees
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Frequency Selector */}
            <div>
              <label className="text-sm font-medium mb-3 block">Choose Your Frequency</label>
              <div className="grid gap-3">
                {FREQUENCY_OPTIONS.map((option) => {
                  const optionPrice = basePrice * (1 - option.discount - BONUS_DISCOUNT);
                  const optionSavings = currentPrice - optionPrice;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedFrequency(option.id)}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all text-left",
                        selectedFrequency === option.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <div className="font-semibold">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                        {option.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {option.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-bold text-primary">
                          ${Math.round(optionPrice)}
                        </span>
                        <span className="text-sm text-muted-foreground">per clean</span>
                        <span className="text-sm text-muted-foreground line-through ml-auto">
                          ${Math.round(currentPrice)}
                        </span>
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Save ${Math.round(optionSavings)} per clean • 
                        {((option.discount + BONUS_DISCOUNT) * 100).toFixed(0)}% total discount
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start Date Picker */}
            <div>
              <label className="text-sm font-medium mb-2 block">When should we start?</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Select start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Annual Savings Highlight */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Your Annual Savings</div>
                <div className="text-3xl font-bold text-primary mb-1">
                  ${Math.round(annualSavings)}
                </div>
                <div className="text-xs text-muted-foreground">
                  That's like getting {freeCleans} free cleanings per year!
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsUpgrading(false)}
              >
                Back
              </Button>
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleUpgrade}
                disabled={!startDate || isSendingWebhook}
              >
                {isSendingWebhook ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Recurring Service'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
