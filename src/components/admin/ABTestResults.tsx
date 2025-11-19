import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ABTestProps {
  timeRange: string;
}

interface TestVariant {
  variant: string;
  sessions: number;
  conversions: number;
  conversion_rate: number;
  revenue: number;
}

export function ABTestResults({ timeRange }: ABTestProps) {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<any[]>([]);

  useEffect(() => {
    fetchABTestData();
  }, [timeRange]);

  const getTimeFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case "24h":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case "90d":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const fetchABTestData = async () => {
    setLoading(true);
    const timeFilter = getTimeFilter();

    // Fetch bookings with UTM data for variant tracking
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, status, est_price, utms, created_at")
      .gte("created_at", timeFilter);

    if (!bookings) {
      setLoading(false);
      return;
    }

    // Simulate A/B test analysis based on different offer types
    const { data: offersData } = await supabase
      .from("bookings")
      .select("offer_type, status, est_price")
      .gte("created_at", timeFilter)
      .not("offer_type", "is", null);

    const testsByOffer = new Map<string, TestVariant[]>();

    offersData?.forEach((booking) => {
      const testName = "Offer Type";
      if (!testsByOffer.has(testName)) {
        testsByOffer.set(testName, []);
      }

      const variants = testsByOffer.get(testName)!;
      let variant = variants.find((v) => v.variant === booking.offer_type);

      if (!variant) {
        variant = {
          variant: booking.offer_type || "default",
          sessions: 0,
          conversions: 0,
          conversion_rate: 0,
          revenue: 0,
        };
        variants.push(variant);
      }

      variant.sessions++;
      if (booking.status === "confirmed" || booking.status === "completed") {
        variant.conversions++;
        variant.revenue += Number(booking.est_price) || 0;
      }
    });

    // Calculate conversion rates
    testsByOffer.forEach((variants) => {
      variants.forEach((variant) => {
        variant.conversion_rate = variant.sessions > 0 ? (variant.conversions / variant.sessions) * 100 : 0;
      });
    });

    const testsArray = Array.from(testsByOffer.entries()).map(([name, variants]) => ({
      name,
      variants: variants.sort((a, b) => b.conversion_rate - a.conversion_rate),
    }));

    setTests(testsArray);
    setLoading(false);
  };

  const getPerformanceIndicator = (rate: number, bestRate: number) => {
    const diff = ((rate - bestRate) / bestRate) * 100;
    if (Math.abs(diff) < 5) return { icon: Minus, color: "text-muted-foreground", label: "Similar" };
    if (diff > 0) return { icon: TrendingUp, color: "text-green-500", label: `+${diff.toFixed(1)}%` };
    return { icon: TrendingDown, color: "text-red-500", label: `${diff.toFixed(1)}%` };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading A/B test data...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (tests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No A/B Tests Found</CardTitle>
          <CardDescription>Start tracking variants to see test results here</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {tests.map((test) => {
        const bestRate = Math.max(...test.variants.map((v: TestVariant) => v.conversion_rate));
        const totalRevenue = test.variants.reduce((sum: number, v: TestVariant) => sum + v.revenue, 0);

        return (
          <Card key={test.name}>
            <CardHeader>
              <CardTitle>{test.name}</CardTitle>
              <CardDescription>
                {test.variants.length} variants • ${totalRevenue.toFixed(2)} total revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {test.variants.map((variant: TestVariant, index: number) => {
                  const indicator = getPerformanceIndicator(variant.conversion_rate, bestRate);
                  const Icon = indicator.icon;

                  return (
                    <div
                      key={variant.variant}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{variant.variant}</span>
                            {index === 0 && bestRate > 0 && (
                              <Badge variant="default">Best Performer</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {variant.sessions} sessions • {variant.conversions} conversions
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-2xl font-bold">{variant.conversion_rate.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">conversion rate</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">${variant.revenue.toFixed(0)}</div>
                          <div className="text-sm text-muted-foreground">revenue</div>
                        </div>
                        <div className={`flex items-center gap-1 ${indicator.color}`}>
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{indicator.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
