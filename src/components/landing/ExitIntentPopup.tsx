import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Mail, X } from 'lucide-react';
import { toast } from 'sonner';

export function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if popup was already shown in this session
    const shown = sessionStorage.getItem('exitIntentShown');
    if (shown) {
      setHasShown(true);
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse leaves the top of the viewport
      if (e.clientY <= 0 && !hasShown) {
        setIsOpen(true);
        setHasShown(true);
        sessionStorage.setItem('exitIntentShown', 'true');
      }
    };

    // Add mouse leave event listener
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasShown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Here you would typically save the email to your database
    // For now, just show success message
    toast.success('Great! Check your email for your 10% discount code.');
    setIsOpen(false);
    
    // Optional: Send email via Supabase edge function
    // await supabase.functions.invoke('send-email-system', {
    //   body: { template: 'exit_intent_discount', to: email }
    // });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-warning animate-pulse" />
              <DialogTitle className="text-2xl">Wait! Don't Go Yet...</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-base">
            Get <span className="text-warning font-bold">10% OFF</span> your first cleaning when you book today!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">
              Enter your email to receive your discount code:
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <ul className="space-y-2 text-sm text-foreground">
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span>
                <span>Instant discount code sent to your email</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span>
                <span>No spam, just your exclusive offer</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span>
                <span>Book within 48 hours to redeem</span>
              </li>
            </ul>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              Send Me My Discount Code
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto"
            >
              No thanks, I'll pay full price
            </Button>
          </DialogFooter>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          By submitting, you agree to receive promotional emails. Unsubscribe anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
}
