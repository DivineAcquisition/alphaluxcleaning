import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Copy, CheckCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function PostPaymentReferralSection() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
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
      const { data, error } = await supabase.rpc('create_referral_code', {
        p_owner_email: email.trim(),
        p_owner_name: name.trim()
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        setGeneratedCode(result.code);
        
        // Automatically copy to clipboard
        await copyToClipboard(result.code);
        
        toast.success("Referral code generated and copied to clipboard!");
      } else {
        toast.error(result?.error || "Failed to generate referral code");
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