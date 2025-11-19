import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StepData {
  step_name: string;
  total_visits: number;
  conversions: number;
  conversion_rate: number;
  drop_off_rate: number;
}

interface DropOffHeatmapProps {
  timeRange: string;
}

export function DropOffHeatmap({ timeRange }: DropOffHeatmapProps) {
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<StepData[]>([]);

  useEffect(() => {
    fetchDropOffData();
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

  const fetchDropOffData = async () => {
    setLoading(true);
    const timeFilter = getTimeFilter();

    const { data: events } = await supabase
      .from("booking_events")
      .select("step_name, event_type, session_id, created_at")
      .gte("created_at", timeFilter)
      .order("created_at", { ascending: true });

    if (!events) {
      setLoading(false);
      return;
    }

    // Calculate funnel metrics
    const stepOrder = ["zip", "sqft", "offer", "checkout", "details", "confirmation"];
    const sessionsByStep = new Map<string, Set<string>>();
    const completedSessions = new Set<string>();

    events.forEach((event) => {
      if (event.step_name) {
        if (!sessionsByStep.has(event.step_name)) {
          sessionsByStep.set(event.step_name, new Set());
        }
        sessionsByStep.get(event.step_name)?.add(event.session_id);
      }
      if (event.event_type === "booking_completed") {
        completedSessions.add(event.session_id);
      }
    });

    const funnelData: StepData[] = stepOrder.map((step, index) => {
      const visits = sessionsByStep.get(step)?.size || 0;
      const nextStep = stepOrder[index + 1];
      const nextVisits = nextStep ? sessionsByStep.get(nextStep)?.size || 0 : completedSessions.size;
      
      const conversions = nextVisits;
      const conversionRate = visits > 0 ? (conversions / visits) * 100 : 0;
      const dropOffRate = visits > 0 ? ((visits - conversions) / visits) * 100 : 0;

      return {
        step_name: step,
        total_visits: visits,
        conversions,
        conversion_rate: conversionRate,
        drop_off_rate: dropOffRate,
      };
    });

    setSteps(funnelData);
    setLoading(false);
  };

  const getStepLabel = (step: string) => {
    const labels: Record<string, string> = {
      zip: "ZIP Code",
      sqft: "Home Size",
      offer: "Service Selection",
      checkout: "Payment",
      details: "Scheduling",
      confirmation: "Confirmation",
    };
    return labels[step] || step;
  };

  const getHeatColor = (dropOffRate: number) => {
    if (dropOffRate < 10) return "bg-green-500";
    if (dropOffRate < 25) return "bg-yellow-500";
    if (dropOffRate < 50) return "bg-orange-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading funnel data...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const totalStarts = steps[0]?.total_visits || 0;
  const totalCompletions = steps[steps.length - 1]?.conversions || 0;
  const overallConversion = totalStarts > 0 ? (totalCompletions / totalStarts) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overall Conversion Funnel</CardTitle>
          <CardDescription>
            {totalStarts} sessions started, {totalCompletions} completed ({overallConversion.toFixed(1)}% conversion)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.step_name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-sm font-medium w-32">{getStepLabel(step.step_name)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Progress value={step.conversion_rate} className="flex-1" />
                        <span className="text-sm font-medium w-16 text-right">
                          {step.conversion_rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-sm text-muted-foreground">
                      {step.total_visits} visits
                    </div>
                    {step.drop_off_rate > 0 && (
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-16 rounded ${getHeatColor(step.drop_off_rate)}`} />
                        <span className="text-sm font-medium text-destructive">
                          -{step.drop_off_rate.toFixed(1)}% drop
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps
          .filter((step) => step.drop_off_rate > 30)
          .sort((a, b) => b.drop_off_rate - a.drop_off_rate)
          .slice(0, 3)
          .map((step) => (
            <Card key={step.step_name} className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  High Drop-Off Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-lg font-bold">{getStepLabel(step.step_name)}</div>
                  <div className="text-3xl font-bold text-destructive">
                    {step.drop_off_rate.toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round((step.total_visits * step.drop_off_rate) / 100)} users lost
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
