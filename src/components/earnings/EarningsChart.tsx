import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface EarningsChartProps {
  data: Array<{
    week: string;
    earnings: number;
    tips: number;
  }>;
}

export function EarningsChart({ data }: EarningsChartProps) {
  const formatCurrency = (value: number) => `$${value.toFixed(0)}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'earnings' ? 'Base Pay' : 'Tips'}: ${entry.value.toFixed(2)}
            </p>
          ))}
          <p className="text-sm font-medium border-t pt-1 mt-1">
            Total: ${(payload[0].value + payload[1].value).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Last 8 Weeks Earnings</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="week" 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="earnings" 
              name="Base Pay"
              stackId="a"
              fill="hsl(var(--primary))" 
              radius={[0, 0, 4, 4]}
            />
            <Bar 
              dataKey="tips" 
              name="Tips"
              stackId="a"
              fill="hsl(var(--primary) / 0.6)" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}