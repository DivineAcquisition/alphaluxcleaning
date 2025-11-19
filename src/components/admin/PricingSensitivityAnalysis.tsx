import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DollarSign, TrendingUp } from "lucide-react";

interface PricingSensitivityProps {
  timeRange: string;
}

interface PricePoint {
  range: string;
  bookings: number;
  conversion_rate: number;
  avg_price: number;
  revenue: number;
}

export function PricingSensitivityAnalysis({ timeRange }: PricingSensitivityProps) {
  const [loading, setLoading] = useState(true);
  const [pricePoints, setPricePoints] = useState<PricePoint[]>([]);
  const [serviceTypeData, setServiceTypeData] = useState<any[]>([]);

  useEffect(() => {
    fetchPricingSensitivity();
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

  const fetchPricingSensitivity = async () => {
    setLoading(true);
    const timeFilter = getTimeFilter();

    const { data: bookings } = await supabase
      .from("bookings")
      .select("est_price, status, service_type, frequency")
      .gte("created_at", timeFilter);

    if (!bookings) {
      setLoading(false);
      return;
    }

    // Group by price ranges
    const ranges = [
      { min: 0, max: 200, label: "$0-$200" },
      { min: 200, max: 400, label: "$200-$400" },
      { min: 400, max: 600, label: "$400-$600" },
      { min: 600, max: 800, label: "$600-$800" },
      { min: 800, max: 1000, label: "$800-$1000" },
      { min: 1000, max: Infinity, label: "$1000+" },
    ];

    const priceData: PricePoint[] = ranges.map((range) => {
      const inRange = bookings.filter(
        (b) => Number(b.est_price) >= range.min && Number(b.est_price) < range.max
      );
      const conversions = inRange.filter(
        (b) => b.status === "confirmed" || b.status === "completed"
      ).length;

      return {
        range: range.label,
        bookings: inRange.length,
        conversion_rate: inRange.length > 0 ? (conversions / inRange.length) * 100 : 0,
        avg_price: inRange.length > 0 
          ? inRange.reduce((sum, b) => sum + Number(b.est_price), 0) / inRange.length 
          : 0,
        revenue: inRange
          .filter((b) => b.status === "confirmed" || b.status === "completed")
          .reduce((sum, b) => sum + Number(b.est_price), 0),
      };
    });

    setPricePoints(priceData.filter((p) => p.bookings > 0));

    // Analyze by service type
    const serviceTypes = ["standard", "deep", "move-in-out", "tester"];
    const serviceData = serviceTypes.map((type) => {
      const typeBookings = bookings.filter((b) => b.service_type === type);
      const conversions = typeBookings.filter(
        (b) => b.status === "confirmed" || b.status === "completed"
      ).length;

      return {
        service_type: type.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        bookings: typeBookings.length,
        conversion_rate: typeBookings.length > 0 ? (conversions / typeBookings.length) * 100 : 0,
        avg_price: typeBookings.length > 0
          ? typeBookings.reduce((sum, b) => sum + Number(b.est_price), 0) / typeBookings.length
          : 0,
        revenue: typeBookings
          .filter((b) => b.status === "confirmed" || b.status === "completed")
          .reduce((sum, b) => sum + Number(b.est_price), 0),
      };
    });

    setServiceTypeData(serviceData.filter((s) => s.bookings > 0));
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading pricing analysis...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const optimalPricePoint = pricePoints.reduce(
    (best, current) =>
      current.conversion_rate > best.conversion_rate ? current : best,
    pricePoints[0]
  );

  const totalRevenue = pricePoints.reduce((sum, p) => sum + p.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Optimal Price Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{optimalPricePoint?.range}</div>
            <div className="text-sm text-muted-foreground">
              {optimalPricePoint?.conversion_rate.toFixed(1)}% conversion rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(0)}</div>
            <div className="text-sm text-muted-foreground">
              {pricePoints.reduce((sum, p) => sum + p.bookings, 0)} total bookings
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {(
                pricePoints.reduce((sum, p) => sum + p.avg_price * p.bookings, 0) /
                pricePoints.reduce((sum, p) => sum + p.bookings, 0)
              ).toFixed(0)}
            </div>
            <div className="text-sm text-muted-foreground">across all bookings</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate by Price Range</CardTitle>
          <CardDescription>How pricing affects booking completion</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pricePoints}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <div className="font-medium">{data.range}</div>
                        <div className="text-sm text-muted-foreground">
                          {data.bookings} bookings
                        </div>
                        <div className="text-sm font-medium">
                          {data.conversion_rate.toFixed(1)}% conversion
                        </div>
                        <div className="text-sm">${data.revenue.toFixed(0)} revenue</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="conversion_rate" fill="hsl(var(--primary))">
                {pricePoints.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.range === optimalPricePoint?.range
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance by Service Type</CardTitle>
          <CardDescription>Revenue and conversion metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serviceTypeData.map((service) => (
              <div key={service.service_type} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">{service.service_type}</div>
                  <div className="text-sm text-muted-foreground">
                    {service.bookings} bookings • ${service.avg_price.toFixed(0)} avg price
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-lg font-semibold">{service.conversion_rate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">conversion</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-500">
                      ${service.revenue.toFixed(0)}
                    </div>
                    <div className="text-sm text-muted-foreground">revenue</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
