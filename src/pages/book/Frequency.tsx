import { useNavigate } from "react-router-dom";
import { useBooking } from "@/contexts/BookingContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useEffect } from "react";
import BookingProgressBar from "@/components/booking/BookingProgressBar";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BookingFrequency() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData } = useBooking();

  useEffect(() => { if (!bookingData.zipCode) navigate('/book/zip'); }, [bookingData.zipCode, navigate]);

  const canRecur = bookingData.serviceType !== 'move_in_out' && bookingData.serviceType !== 'deep';
  const frequencies = [
    { id: 'one_time', name: 'One-Time', description: 'Perfect for occasional needs', tagline: 'No commitment', discount: '', availableForAll: true },
    { id: 'weekly', name: 'Weekly', description: '4× per month', tagline: 'Maximum savings', discount: '15%', availableForAll: false },
    { id: 'bi_weekly', name: 'Every 2 Weeks', description: '2× per month', tagline: 'Great balance', discount: '10%', availableForAll: false },
    { id: 'monthly', name: 'Monthly', description: 'Once per month', tagline: 'Light maintenance', discount: '5%', availableForAll: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <BookingProgressBar currentStep={3} totalSteps={6} />
      <div className="container mx-auto px-4 py-4 lg:py-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <a href="/book/tier" className="text-sm text-muted-foreground hover:text-primary mb-3 inline-block">← Previous</a>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">How often?</h1>
            <p className="text-base text-muted-foreground">Save up to 15% with recurring service</p>
          </div>
          <div className="space-y-3 mb-6">
            {frequencies.map((freq) => (
              <Card key={freq.id} className={`p-4 cursor-pointer transition-all hover:shadow-lg ${bookingData.frequency === freq.id ? 'ring-2 ring-primary shadow-lg' : ''} ${!freq.availableForAll && !canRecur ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => (freq.availableForAll || canRecur) && updateBookingData({ frequency: freq.id })}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold">{freq.name}</h3>
                      {freq.discount && <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">Save {freq.discount}</span>}
                      {freq.id === 'weekly' && <span className="bg-accent text-accent-foreground text-xs font-semibold px-2 py-0.5 rounded-full">Most Popular</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-0.5">{freq.description}</p>
                    <p className="text-xs text-muted-foreground italic">{freq.tagline}</p>
                  </div>
                  {bookingData.frequency === freq.id && <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center ml-3 flex-shrink-0"><Check className="h-3 w-3 text-primary-foreground" /></div>}
                </div>
              </Card>
            ))}
          </div>
          {!canRecur && <Alert className="mb-6"><AlertDescription className="text-sm">Recurring service is available for Standard Cleaning only.</AlertDescription></Alert>}
          <div className="text-center text-xs text-muted-foreground mb-4">See full pricing breakdown on next step</div>
          <div className="flex justify-center"><Button onClick={() => navigate('/book/schedule')} size="default" className="min-w-[180px]" disabled={!bookingData.frequency}>Continue to Schedule</Button></div>
        </div>
      </div>
    </div>
  );
}
