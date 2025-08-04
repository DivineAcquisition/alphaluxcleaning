import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminCard } from "@/components/admin/AdminCard";
import { BarChart, TrendingUp, Users, DollarSign, PieChart, Target, Clock, Star } from "lucide-react";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { BookingsChart } from "@/components/dashboard/BookingsChart";
import { LTVMetrics } from "@/components/dashboard/LTVMetrics";
import { RetentionMetrics } from "@/components/dashboard/RetentionMetrics";

// Mock data for charts
const mockOrders = [
  { id: 1, amount: 15000, created_at: '2024-01-15', status: 'completed' },
  { id: 2, amount: 22000, created_at: '2024-02-10', status: 'completed' },
  { id: 3, amount: 18500, created_at: '2024-03-05', status: 'completed' },
];

const mockBookings = [
  { id: 1, service_date: '2024-01-15', cleaning_type: 'deep-clean', status: 'completed' },
  { id: 2, service_date: '2024-02-10', cleaning_type: 'regular', status: 'completed' },
  { id: 3, service_date: '2024-03-05', cleaning_type: 'move-out', status: 'completed' },
];

export default function AnalyticsDashboard() {
  return (
    <AdminLayout 
      title="Business Intelligence Portal" 
      description="Advanced analytics and predictive insights for business growth"
    >
      {/* Key Performance Metrics */}
      <AdminGrid columns="auto" gap="lg">
        <AdminCard title="Revenue Growth" icon={<DollarSign className="h-5 w-5" />} variant="metric">
          <div className="text-3xl font-bold text-primary">+24.5%</div>
          <p className="text-sm text-muted-foreground">vs last quarter</p>
        </AdminCard>
        
        <AdminCard title="Customer Lifetime Value" icon={<TrendingUp className="h-5 w-5" />} variant="metric">
          <div className="text-3xl font-bold text-success">$2,847</div>
          <p className="text-sm text-muted-foreground">Average CLV</p>
        </AdminCard>
        
        <AdminCard title="Churn Rate" icon={<Users className="h-5 w-5" />} variant="metric">
          <div className="text-3xl font-bold text-warning">8.2%</div>
          <p className="text-sm text-muted-foreground">Monthly churn</p>
        </AdminCard>
        
        <AdminCard title="Satisfaction Score" icon={<Star className="h-5 w-5" />} variant="metric">
          <div className="text-3xl font-bold text-accent">4.8/5</div>
          <p className="text-sm text-muted-foreground">Customer rating</p>
        </AdminCard>
      </AdminGrid>

      {/* Advanced Analytics Charts */}
      <AdminGrid columns={2} gap="lg">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Revenue Forecasting
            </CardTitle>
            <CardDescription>
              AI-powered revenue predictions and seasonal trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart orders={mockOrders} />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Booking Analytics
            </CardTitle>
            <CardDescription>
              Service distribution and demand patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookingsChart bookings={mockBookings} />
          </CardContent>
        </Card>
      </AdminGrid>

      {/* Customer Intelligence */}
      <AdminGrid columns={2} gap="lg">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Customer Lifetime Value
            </CardTitle>
            <CardDescription>
              Segmentation and value prediction analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LTVMetrics orders={mockOrders} />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Retention Analytics
            </CardTitle>
            <CardDescription>
              Customer retention patterns and churn prediction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RetentionMetrics orders={mockOrders} />
          </CardContent>
        </Card>
      </AdminGrid>

      {/* Predictive Analytics */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Predictive Intelligence Dashboard</CardTitle>
          <CardDescription>
            AI-powered insights for demand forecasting and business optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminGrid columns={3} gap="md">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground">Demand Forecast</h4>
              <p className="text-2xl font-bold text-primary">+18%</p>
              <p className="text-xs text-muted-foreground">Next month prediction</p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground">Optimal Pricing</h4>
              <p className="text-2xl font-bold text-success">$149</p>
              <p className="text-xs text-muted-foreground">Recommended rate</p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground">Risk Score</h4>
              <p className="text-2xl font-bold text-warning">Low</p>
              <p className="text-xs text-muted-foreground">Churn probability</p>
            </div>
          </AdminGrid>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}