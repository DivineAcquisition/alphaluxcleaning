import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, Mail, MessageSquare, Gift, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function GetReferral() {
  const [step, setStep] = useState<"form" | "results">("form");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    email: "",
  });
  const [referralData, setReferralData] = useState({
    code: "",
    link: "",
    isNew: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('public-referral-generator', {
        body: {
          first_name: formData.first_name,
          email: formData.email,
        },
      });

      if (error) throw error;

      if (data.success) {
        setReferralData({
          code: data.referral_code,
          link: data.referral_link,
          isNew: data.is_new,
        });
        setStep("results");
        toast.success(data.message);
      } else {
        toast.error(data.error || "Failed to generate referral code");
      }
    } catch (error: any) {
      console.error("Error generating referral:", error);
      toast.error(error.message || "Failed to generate referral code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent("Get $50 off your first cleaning!");
    const body = encodeURIComponent(
      `Hey! I wanted to share this awesome cleaning service with you. Use my referral link to get $50 off your first booking: ${referralData.link}\n\nThey're professional, reliable, and do amazing work!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const shareViaSMS = () => {
    const message = encodeURIComponent(
      `Get $50 off your first professional cleaning! Use my referral: ${referralData.link}`
    );
    window.open(`sms:?&body=${message}`, "_blank");
  };

  if (step === "results") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-elegant">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl">Your Referral Code is Ready!</CardTitle>
            <CardDescription className="text-base">
              Share this code with friends and you'll both earn $50
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Referral Code Display */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Your Referral Code</label>
              <div className="flex gap-2">
                <Input
                  value={referralData.code}
                  readOnly
                  className="text-2xl font-bold text-center tracking-wider"
                />
                <Button
                  onClick={() => copyToClipboard(referralData.code, "Referral code")}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Referral Link Display */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Your Referral Link</label>
              <div className="flex gap-2">
                <Input value={referralData.link} readOnly className="font-mono text-sm" />
                <Button
                  onClick={() => copyToClipboard(referralData.link, "Referral link")}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Share Options */}
            <div className="space-y-3 pt-4">
              <p className="text-sm font-medium text-center text-muted-foreground">
                Share with friends
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={shareViaEmail} variant="outline" className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button onClick={shareViaSMS} variant="outline" className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  SMS
                </Button>
              </div>
            </div>

            {/* How it Works */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                How It Works
              </h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-bold text-primary">1.</span>
                  <span>Share your referral code or link with friends</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">2.</span>
                  <span>They get $50 off their first cleaning service</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">3.</span>
                  <span>You earn $50 credit after their booking is completed</span>
                </li>
              </ol>
            </div>

            <Button
              onClick={() => {
                setStep("form");
                setFormData({ first_name: "", email: "" });
              }}
              variant="outline"
              className="w-full"
            >
              Create Another Code
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-elegant">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl">Get Your Referral Link</CardTitle>
          <CardDescription className="text-base">
            Start earning $50 for every friend you refer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Benefits */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">$50</div>
                <div className="text-xs text-muted-foreground">They Get</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">$50</div>
                <div className="text-xs text-muted-foreground">You Get</div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="first_name" className="text-sm font-medium">
                  First Name
                </label>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="Enter your first name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                "Generating..."
              ) : (
                <>
                  Get My Referral Link
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            {/* Features */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                No limit on earnings
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Professional cleaning service
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                100% satisfaction guaranteed
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
