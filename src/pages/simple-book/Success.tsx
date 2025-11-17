import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, MessageSquare, Share2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const { toast } = useToast();

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  const referralCode = 'FRIEND50'; // This should be generated per customer
  const referralLink = `https://novaracleaning.com/book?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard',
    });
  };

  const handleShareWhatsApp = () => {
    const message = `Hey! I just booked a deep clean with Novara Cleaning and they're amazing. Use my link to get $50 off: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = 'Get $50 off your first cleaning with Novara';
    const body = `Hey!\n\nI just booked a deep clean with Novara Cleaning and wanted to share this with you. They're offering $50 off your first clean if you use my referral link:\n\n${referralLink}\n\nHighly recommend them!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Message */}
        <Card className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Your Deep Clean is Locked In 🎉
          </h1>
          
          <p className="text-lg text-muted-foreground mb-6">
            Booking ID: <span className="font-mono font-semibold">{bookingId}</span>
          </p>

          <div className="bg-muted/50 rounded-lg p-6 space-y-3 text-left">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <p className="text-sm">
                <span className="font-semibold">Email confirmation</span> sent to your inbox
              </p>
            </div>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <p className="text-sm">
                <span className="font-semibold">SMS confirmation</span> with booking details and arrival window
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Our team will contact you within 24 hours to confirm all details.
          </p>
        </Card>

        {/* Referral Section */}
        <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Share the Love, Get $50 Each! 💰</h2>
            <p className="text-muted-foreground">
              When your friend books using your link, you both save $50 on your next clean
            </p>
          </div>

          <div className="bg-background rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Your Referral Code</p>
                <p className="text-2xl font-bold text-primary font-mono">{referralCode}</p>
              </div>
              <Button onClick={handleCopyLink} variant="outline" size="lg">
                <Copy className="h-5 w-5 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={handleShareWhatsApp} variant="default" size="lg" className="w-full">
              <MessageSquare className="h-5 w-5 mr-2" />
              Share on WhatsApp
            </Button>
            <Button onClick={handleShareEmail} variant="default" size="lg" className="w-full">
              <Mail className="h-5 w-5 mr-2" />
              Share via Email
            </Button>
          </div>

          <div className="mt-6 p-4 bg-background/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Share2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <div className="text-sm space-y-2">
                <p className="font-semibold">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Share your unique referral link with friends</li>
                  <li>They get $50 off their first booking</li>
                  <li>You get $50 credit after their first clean</li>
                  <li>No limit on how many friends you can refer!</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center">
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
