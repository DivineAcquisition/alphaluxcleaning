import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Share2, Copy, Users, Gift, Trophy, Star, Facebook, Twitter, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReferralData {
  code: string;
  totalReferrals: number;
  tier: string;
  points: number;
  nextReward: number;
}

export function ReferralSystemV2() {
  const [referralData, setReferralData] = useState<ReferralData>({
    code: "CLEAN50",
    totalReferrals: 12,
    tier: "Silver",
    points: 750,
    nextReward: 1000
  });
  const [shareUrl, setShareUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const baseUrl = window.location.origin;
    setShareUrl(`${baseUrl}?ref=${referralData.code}`);
  }, [referralData.code]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const shareToSocial = (platform: string) => {
    const message = `Get 50% off your first deep clean with Bay Area Cleaning Pros! Use my referral code: ${referralData.code}`;
    const encodedMessage = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(shareUrl);
    
    let socialUrl = "";
    
    switch (platform) {
      case "facebook":
        socialUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`;
        break;
      case "twitter":
        socialUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
        break;
      case "email":
        socialUrl = `mailto:?subject=Get 50% off your first clean!&body=${encodedMessage}%0A%0A${shareUrl}`;
        break;
    }
    
    if (socialUrl) {
      window.open(socialUrl, "_blank");
    }
  };

  const tierProgress = (referralData.points / referralData.nextReward) * 100;

  const rewards = [
    { tier: "Bronze", referrals: 5, reward: "$25 credit", unlocked: true },
    { tier: "Silver", referrals: 10, reward: "$50 credit", unlocked: true },
    { tier: "Gold", referrals: 20, reward: "$100 credit + free supplies", unlocked: false },
    { tier: "Platinum", referrals: 50, reward: "$250 credit + priority booking", unlocked: false },
  ];

  return (
    <div className="space-y-6">
      {/* Referral Overview */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Enhanced Referral Program
          </CardTitle>
          <CardDescription>
            Earn rewards for every friend you refer. The more you share, the more you earn!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Status */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{referralData.totalReferrals}</div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
              
              <div className="text-center">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  <Trophy className="h-4 w-4 mr-1" />
                  {referralData.tier} Tier
                </Badge>
              </div>
            </div>

            {/* Progress to Next Reward */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress to next reward</span>
                  <span>{referralData.points}/{referralData.nextReward} points</span>
                </div>
                <Progress value={tierProgress} className="h-2" />
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{referralData.nextReward - referralData.points}</div>
                <p className="text-sm text-muted-foreground">Points until Gold tier</p>
              </div>
            </div>

            {/* Your Referral Code */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Your Referral Code</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={referralData.code}
                    readOnly
                    className="font-mono text-center"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(referralData.code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Share Link</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(shareUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Sharing */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share with Friends
          </CardTitle>
          <CardDescription>
            Share on social media and earn points faster
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-12 justify-start"
              onClick={() => shareToSocial("facebook")}
            >
              <Facebook className="h-5 w-5 mr-3 text-blue-600" />
              Share on Facebook
            </Button>
            
            <Button
              variant="outline"
              className="h-12 justify-start"
              onClick={() => shareToSocial("twitter")}
            >
              <Twitter className="h-5 w-5 mr-3 text-blue-400" />
              Share on Twitter
            </Button>
            
            <Button
              variant="outline"
              className="h-12 justify-start"
              onClick={() => shareToSocial("email")}
            >
              <Mail className="h-5 w-5 mr-3 text-gray-600" />
              Send via Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rewards Tiers */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Rewards Tiers</CardTitle>
          <CardDescription>
            Unlock better rewards as you refer more friends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rewards.map((reward, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  reward.unlocked
                    ? "bg-success/10 border-success/20"
                    : "bg-muted/50 border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      reward.unlocked ? "bg-success/20" : "bg-muted"
                    }`}>
                      {reward.unlocked ? (
                        <Star className="h-4 w-4 text-success" />
                      ) : (
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{reward.tier} Tier</h4>
                      <p className="text-sm text-muted-foreground">
                        {reward.referrals} referrals required
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{reward.reward}</div>
                    <Badge variant={reward.unlocked ? "default" : "outline"}>
                      {reward.unlocked ? "Unlocked" : "Locked"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Preview */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Referrers This Month
          </CardTitle>
          <CardDescription>
            See how you stack up against other users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Sarah M.", referrals: 28, tier: "Platinum" },
              { name: "Mike T.", referrals: 22, tier: "Gold" },
              { name: "You", referrals: referralData.totalReferrals, tier: referralData.tier },
              { name: "Jessica L.", referrals: 8, tier: "Bronze" },
              { name: "David K.", referrals: 5, tier: "Bronze" },
            ].map((user, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  user.name === "You" ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.tier} Tier</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{user.referrals}</div>
                  <div className="text-sm text-muted-foreground">referrals</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}