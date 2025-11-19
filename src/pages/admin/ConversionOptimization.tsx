import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ABTestResults } from "@/components/admin/ABTestResults";
import { DropOffHeatmap } from "@/components/admin/DropOffHeatmap";
import { PricingSensitivityAnalysis } from "@/components/admin/PricingSensitivityAnalysis";
import { TrendingUp, Users, DollarSign } from "lucide-react";

export default function ConversionOptimization() {
  const [timeRange, setTimeRange] = useState("7d");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conversion Optimization</h1>
          <p className="text-muted-foreground mt-2">
            Analyze user behavior, test variations, and optimize pricing
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      <Tabs defaultValue="funnel" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="funnel" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Drop-Off Analysis
          </TabsTrigger>
          <TabsTrigger value="abtests" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            A/B Tests
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing Sensitivity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-6">
          <DropOffHeatmap timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="abtests" className="space-y-6">
          <ABTestResults timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <PricingSensitivityAnalysis timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
