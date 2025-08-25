import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Users, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function ReferralSection() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const generateReferralCode = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email first");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter your name first");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.rpc('create_referral_code', {
        p_owner_email: email,
        p_owner_name: name
      });

      if (error) throw error;

      const result = data as { error?: string; code?: string };
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.code) {
        setGeneratedCode(result.code);
        
        // Send referral email
        try {
          const { error: emailError } = await supabase.functions.invoke('send-referral-email', {
            body: {
              ownerName: name,
              ownerEmail: email,
              referralCode: result.code
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
        
        copyToClipboard(result.code);
      }
    } catch (error) {
      console.error("Error generating referral code:", error);
      toast.error("Error generating referral code");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      toast.success("Referral code copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-success/5 to-primary/5 border-success/20">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gift className="h-6 w-6 text-success" />
          <CardTitle className="text-2xl text-success">Referral Program</CardTitle>
        </div>
        <CardDescription className="text-lg">
          Refer friends and save! Get 50% off your next deep cleaning when they book.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-white/50 p-6 rounded-lg border border-success/20">
          <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-success" />
            How It Works
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-success text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Generate your unique referral code below</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-success text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Share your code with friends and family</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-success text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>When they book using your code, you both get 50% off your next deep cleaning!</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="referral-name">Your Name</Label>
              <Input
                id="referral-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral-email">Your Email</Label>
              <Input
                id="referral-email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={generateReferralCode}
            disabled={isGenerating || !email.trim() || !name.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? "Generating..." : "Generate My Referral Code"}
          </Button>

          {generatedCode && (
            <div className="bg-white/70 p-4 rounded-lg border border-success/30 text-center">
              <Label className="text-sm text-muted-foreground mb-2 block">Your Referral Code:</Label>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="font-mono font-bold text-xl text-success bg-white px-4 py-2 rounded border">
                  {generatedCode}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedCode)}
                  className="flex items-center gap-1"
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {isCopied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Share this code with your friends to give them 50% off their deep cleaning!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}