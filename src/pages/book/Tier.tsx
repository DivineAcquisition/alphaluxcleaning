import { useNavigate } from "react-router-dom";
import { useBooking } from "@/contexts/BookingContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { BookingProgressBar } from "@/components/booking/BookingProgressBar";
import { SQFT_RANGES } from "@/lib/tier-pricing-system";

export default function BookingTier() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData } = useBooking();
  const [selectedSqft, setSelectedSqft] = useState<number>(bookingData.sqft || 2000);
  const [selectedTier, setSelectedTier] = useState<'essential' | 'premium'>(bookingData.tier || 'premium');

  useEffect(() => {
    if (!bookingData.zipCode) navigate('/book/zip');
  }, [bookingData.zipCode, navigate]);

  const sqftOptions = SQFT_RANGES.map(range => ({ value: range.min, label: range.label }));
  const essentialFeatures = ['Surface cleaning', 'Bathrooms & kitchen', 'Vacuum & mop floors', 'Dust surfaces'];
  const premiumFeatures = ['Everything in Essential', 'Baseboards & window sills', 'Inside cabinets', 'Appliance detailing', 'Deeper bathroom scrubbing'];

  const handleContinue = () => {
    updateBookingData({ tier: selectedTier, sqft: selectedSqft });
    navigate('/book/frequency');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <BookingProgressBar currentStep={2} totalSteps={6} />
      <div className="container mx-auto px-4 py-4 lg:py-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <a href="/book/zip" className="text-sm text-muted-foreground hover:text-primary mb-3 inline-block">← Previous</a>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Choose Your Clean</h1>
            <p className="text-base text-muted-foreground">Select your home size and service level</p>
          </div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-center">Home Size</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {sqftOptions.map((option) => (
                <Button key={option.value} variant={selectedSqft === option.value ? "default" : "outline"} onClick={() => setSelectedSqft(option.value)} className="min-w-[140px] text-sm" size="sm">{option.label}</Button>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card className={`relative p-4 cursor-pointer transition-all hover:shadow-lg ${selectedTier === 'essential' ? 'ring-2 ring-primary shadow-lg' : ''}`} onClick={() => setSelectedTier('essential')}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1"><Home className="h-5 w-5 text-primary" /><h3 className="text-xl font-bold">Essential Clean</h3></div>
                  <p className="text-sm text-muted-foreground">For homes that just need to feel clean again</p>
                </div>
                {selectedTier === 'essential' && <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0"><Check className="h-3 w-3 text-primary-foreground" /></div>}
              </div>
              <ul className="space-y-1 mb-4">{essentialFeatures.map((f, i) => <li key={i} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" /><span>{f}</span></li>)}</ul>
              <div className="text-sm text-muted-foreground mb-3">Reserve your spot for <span className="font-semibold text-foreground">$49</span></div>
              <Button variant={selectedTier === 'essential' ? 'default' : 'outline'} className="w-full" size="sm">Select Essential</Button>
            </Card>
            <Card className={`relative p-4 cursor-pointer transition-all hover:shadow-lg ${selectedTier === 'premium' ? 'ring-2 ring-primary shadow-lg' : ''}`} onClick={() => setSelectedTier('premium')}>
              <div className="absolute -top-2 right-4"><span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">⭐ RECOMMENDED</span></div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1"><Sparkles className="h-5 w-5 text-primary" /><h3 className="text-xl font-bold">Premium Reset</h3></div>
                  <p className="text-sm text-muted-foreground">For busy professionals who want a hotel-level reset</p>
                </div>
                {selectedTier === 'premium' && <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0"><Check className="h-3 w-3 text-primary-foreground" /></div>}
              </div>
              <ul className="space-y-1 mb-4">{premiumFeatures.map((f, i) => <li key={i} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" /><span>{f}</span></li>)}</ul>
              <div className="text-sm text-muted-foreground mb-3">Reserve your spot for <span className="font-semibold text-foreground">$49</span></div>
              <Button variant={selectedTier === 'premium' ? 'default' : 'outline'} className="w-full" size="sm">Select Premium</Button>
            </Card>
          </div>
          <div className="text-center text-sm text-muted-foreground mb-6"><span className="text-xs">See full pricing on next step • 40% of customers choose Premium</span></div>
          <div className="flex justify-center"><Button onClick={handleContinue} size="default" className="min-w-[180px]">Continue to Frequency</Button></div>
        </div>
      </div>
    </div>
  );
}
