import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Copy, CheckCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PostPaymentReferralSectionProps {
  customerEmail?: string;
  customerName?: string;
  onReferralGenerated?: (code: string) => void;
}

export function PostPaymentReferralSection({ 
  customerEmail = '', 
  customerName = '',
  onReferralGenerated 
}: PostPaymentReferralSectionProps) {
  const [email, setEmail] = useState(customerEmail);
  const [name, setName] = useState(customerName);
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateReferralCode = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.rpc('generate_referral_code', {
        customer_email: email.trim(),
        customer_id: crypto.randomUUID() // Generate a temporary UUID for the customer
      });

      if (error) throw error;

      if (data) {
        setGeneratedCode(data);
        
        // Send referral email
        try {
          const { error: emailError } = await supabase.functions.invoke('send-referral-email', {
            body: {
              ownerName: name,
              ownerEmail: email,
              referralCode: data
            }
          });
          
          if (emailError) {
            console.error('Email error:', emailError);
            toast.success("Referral code generated! Check your email for details.");
          } else {
            toast.success("Referral code generated and sent to your email!");
          }
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          toast.success("Referral code generated! Email delivery may be delayed.");
        }
        
        // Automatically copy to clipboard
        await copyToClipboard(data);
        onReferralGenerated?.(data);
      } else {
        toast.error("Failed to generate referral code");
      }
    } catch (error) {
      console.error("Error generating referral code:", error);
      toast.error("Failed to generate referral code");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-green-800">
          <Gift className="h-6 w-6" />
          Share & Save Together
        </CardTitle>
        <CardDescription className="text-green-600">
          Generate your referral code and earn rewards when friends book
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!generatedCode ? (
          <>
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Users className="h-5 w-5" />
                <span className="font-semibold">How it works:</span>
              </div>
              <div className="text-sm text-green-600 space-y-1">
                <p>• Share your code with friends</p>
                <p>• They get 10% off their first service</p>
                <p>• You get 50% off your next cleaning!</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="referralName" className="text-green-800">Your Name</Label>
                <Input
                  id="referralName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="border-green-200 focus:border-green-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="referralEmail" className="text-green-800">Your Email</Label>
                <Input
                  id="referralEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="border-green-200 focus:border-green-400"
                />
              </div>
              
              <Button 
                onClick={generateReferralCode}
                disabled={isGenerating || !name.trim() || !email.trim()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isGenerating ? "Generating..." : "Generate My Referral Code"}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <CheckCircle className="h-6 w-6" />
              <span className="text-lg font-semibold">Your Referral Code is Ready!</span>
            </div>
            
            <div className="bg-white/80 border-2 border-green-300 rounded-lg p-4">
              <div className="text-3xl font-mono font-bold text-green-800 mb-2">
                {generatedCode}
              </div>
              <Button
                onClick={() => copyToClipboard(generatedCode)}
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-sm text-green-600 space-y-1">
              <p>Share this code with friends and family!</p>
              <p className="font-semibold">You'll earn 50% off when they book their first service.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}