import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { squarePromise } from "@/lib/square";
import { supabase } from "@/integrations/supabase/client";

interface EmbeddedSquarePaymentFormProps {
  clientSecret?: string;
  paymentAmount: number;
  fullAmount: number;
  paymentType: "full" | "deposit" | "full_with_discount";
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  bookingId?: string;
  applyCredits?: boolean;
  creditsAmount?: number;
  prepaymentDiscount?: {
    applied: boolean;
    amount: number;
  };
  deepCleanDiscount?: {
    applied: boolean;
    amount: number;
  };
}

export function EmbeddedSquarePaymentForm({
  paymentAmount,
  fullAmount,
  paymentType,
  onSuccess,
  onCancel,
  customerEmail,
  customerName,
  customerPhone,
  bookingId,
  applyCredits = false,
  creditsAmount = 0,
  prepaymentDiscount,
  deepCleanDiscount,
}: EmbeddedSquarePaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [card, setCard] = useState<any>(null);
  const [isCardReady, setIsCardReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add refs to prevent double initialization
  const isInitialized = React.useRef(false);
  const cardInstanceRef = React.useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    
    const initializeSquare = async () => {
      // Prevent double initialization
      if (!mounted || isInitialized.current) {
        console.log("⚠️ Square already initialized or component unmounted, skipping");
        return;
      }

      setIsInitializing(true);
      try {
        console.log("🎨 Initializing Square payment form");
        
        // Destroy existing instance if any
        if (cardInstanceRef.current) {
          await cardInstanceRef.current.destroy();
          cardInstanceRef.current = null;
        }

        const square = await squarePromise;
        
        if (!square?.payments) {
          throw new Error("Square payments not initialized");
        }

        // Initialize card payment method only if still mounted
        if (!mounted) return;
        
        const cardInstance = await square.payments.card();
        await cardInstance.attach("#square-card-container");
        
        if (!mounted) {
          await cardInstance.destroy();
          return;
        }
        
        cardInstanceRef.current = cardInstance;
        setCard(cardInstance);
        setIsCardReady(true);
        isInitialized.current = true;
        setIsInitializing(false);
        console.log("✅ Square card form initialized");
      } catch (err: any) {
        console.error("❌ Error initializing Square:", err);
        if (mounted) {
          setError(err.message || "Failed to initialize payment form");
          setIsInitializing(false);
          isInitialized.current = false;
          toast.error("Payment form initialization failed. Please refresh the page.");
        }
      }
    };

    initializeSquare();

    return () => {
      mounted = false;
      console.log("🧹 Cleaning up Square card instance");
      if (cardInstanceRef.current) {
        cardInstanceRef.current.destroy();
        cardInstanceRef.current = null;
      }
      isInitialized.current = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!card || !isCardReady) {
      toast.error("Payment form not ready. Please wait a moment.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("💳 Tokenizing card...");
      
      // Tokenize the card
      const tokenResult = await card.tokenize();
      
      if (tokenResult.status !== "OK") {
        throw new Error(tokenResult.errors?.[0]?.message || "Card tokenization failed");
      }

      const { token, details } = tokenResult;
      console.log("✅ Card tokenized successfully");

      // Create payment via our edge function
      console.log("💰 Creating payment...");
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        "create-square-payment",
        {
          body: {
            amount: paymentAmount,
            customerEmail,
            customerName,
            customerPhone,
            bookingId,
            sourceId: token,
            verificationToken: details?.verificationToken,
            applyCredits,
            creditsAmount,
          },
        }
      );

      if (paymentError) {
        throw new Error(paymentError.message || "Payment failed");
      }

      if (!paymentData?.success) {
        throw new Error(paymentData?.error || "Payment failed");
      }

      console.log("✅ Payment successful:", paymentData.payment_id);
      
      toast.success(
        paymentData.credits_applied > 0
          ? `Payment successful! $${paymentData.credits_applied.toFixed(2)} in credits applied.`
          : "Payment successful!"
      );
      
      onSuccess(paymentData.payment_id);
    } catch (err: any) {
      console.error("❌ Payment error:", err);
      const errorMessage = err.message || "Payment failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {paymentType === "deposit" ? "Pay 20% Deposit" : paymentType === "full_with_discount" ? "Pay Full Amount (5% Discount)" : "Complete Payment"}
          </h3>
          
          {deepCleanDiscount?.applied && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-blue-700 font-semibold">
                <span className="text-lg">✨</span>
                <span>Deep Cleaning Discount Applied!</span>
              </div>
              <div className="flex justify-between text-sm text-blue-600 font-semibold">
                <span>You Save (20% OFF):</span>
                <span>-${deepCleanDiscount.amount.toFixed(2)}</span>
              </div>
            </div>
          )}
          
          {prepaymentDiscount?.applied && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <span className="text-lg">🎉</span>
                <span>Prepayment Discount Applied!</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground line-through">Original Price:</span>
                <span className="text-muted-foreground line-through">${fullAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 font-semibold">
                <span>You Save:</span>
                <span>-${prepaymentDiscount.amount.toFixed(2)}</span>
              </div>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {paymentType === "deposit" ? "Deposit Amount:" : "Total Amount:"}
            </span>
            <span className="font-semibold">${paymentAmount.toFixed(2)}</span>
          </div>
          {paymentType === "deposit" && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Full Amount:</span>
              <span className="text-muted-foreground">${fullAmount.toFixed(2)}</span>
            </div>
          )}
          {applyCredits && creditsAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Credits Applied:</span>
              <span>-${creditsAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="relative">
            {/* Always render container so Square can attach to it - key prevents double mounting */}
            <div 
              id="square-card-container"
              key="square-payment-container"
              className={`min-h-[200px] transition-opacity ${isInitializing ? 'opacity-0' : 'opacity-100'}`}
            />
            
            {/* Show loading overlay while initializing */}
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading payment form...</span>
              </div>
            )}
          </div>
          
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isLoading || !isCardReady}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${paymentAmount.toFixed(2)}`
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </Card>
    </form>
  );
}
