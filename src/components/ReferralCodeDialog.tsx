import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ReferralCodeDialogProps {
  onCodeGenerated?: (code: string) => void;
  trigger?: React.ReactNode;
}

export function ReferralCodeDialog({ onCodeGenerated, trigger }: ReferralCodeDialogProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [open, setOpen] = useState(false);

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
        toast.success("Referral code generated successfully!");
        onCodeGenerated?.(result.code);
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

  const handleClose = () => {
    setOpen(false);
    if (generatedCode && onCodeGenerated) {
      onCodeGenerated(generatedCode);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="link" className="p-0 h-auto text-sm text-primary">
            Don't have a referral code? Generate one here!
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-success" />
            Generate Referral Code
          </DialogTitle>
          <DialogDescription>
            Create your unique referral code to share with friends and family.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dialog-name">Your Name</Label>
            <Input
              id="dialog-name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-email">Your Email</Label>
            <Input
              id="dialog-email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button 
            onClick={generateReferralCode}
            disabled={isGenerating || !email.trim() || !name.trim()}
            className="w-full"
          >
            {isGenerating ? "Generating..." : "Generate My Referral Code"}
          </Button>

          {generatedCode && (
            <div className="bg-muted/50 p-4 rounded-lg border text-center">
              <Label className="text-sm text-muted-foreground mb-2 block">Your Referral Code:</Label>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="font-mono font-bold text-lg text-success bg-background px-3 py-2 rounded border">
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
              <p className="text-sm text-muted-foreground mb-3">
                Share this code with your friends to give them 10% off their service!
              </p>
              <Button onClick={handleClose} variant="outline" size="sm">
                Use This Code
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}