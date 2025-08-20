import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ChatFallback } from './ChatFallback';
import { HelpCircle, X } from 'lucide-react';

interface MobileHelpButtonProps {
  className?: string;
}

export function MobileHelpButton({ className = "" }: MobileHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 ${className}`}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[50vh]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Need Help?</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Our customer service team is ready to assist you with your booking, 
            service questions, or any other inquiries.
          </p>
          
          <ChatFallback />
          
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Business Hours: Monday - Friday, 8:00 AM - 6:00 PM PST
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}