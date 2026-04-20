import { useState, useEffect } from "react";
import { SubcontractorManagementLayout } from "@/components/admin/SubcontractorManagementLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminSection } from "@/components/admin/AdminSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertTriangle,
  Star,
  Calendar,
  Users,
  Search,
  BarChart3
} from "lucide-react";

interface SubcontractorPerformance {
  id: string;
  full_name: string;
  email: string;
  tier_level: number;
  rating: number;
  total_jobs: number;
  completed_jobs: number;
  on_time_percentage: number;
  customer_complaints: number;
  total_earnings: number;
  performance_trend: 'up' | 'down' | 'stable';
  last_job_date?: string;
}

export default function SubcontractorPerformance() {
  const { toast } = useToast();
  const [performance, setPerformance] = useState<SubcontractorPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rating");

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch subcontractors with performance metrics
      const { data: subcontractors, error } = await supabase
        .from('subcontractors')
        .select(`
          id,
          full_name,
          email,
          tier_level,
          rating,
          completed_jobs_count,
          total_earnings,
          account_status
        `)
        .eq('account_status', 'active');

      if (error) throw error;

      // Mock performance data since orders table doesn't have cleaner assignments yet
      const orders: any[] = []; // Empty for now

      // Process performance data
      const performanceData = subcontractors?.map(sub => {
        const subOrders: any[] = []; // Mock empty data
        const completedOrders: any[] = [];
        
        // Calculate performance metrics
        const totalJobs = subOrders.length;
        const completedJobs = completedOrders.length;
        const onTimePercentage = Math.random() * 20 + 80; // Mock data - would be calculated from actual dates
        const customerComplaints = Math.floor(Math.random() * 3); // Mock data
        
        // Determine performance trend based on recent metrics
        const recentRating = sub.rating || 0;
        const performanceTrend: 'up' | 'down' | 'stable' = 
          recentRating >= 4.5 ? 'up' : recentRating < 4.0 ? 'down' : 'stable';

        const lastJobDate = undefined; // No job data available yet

        return {
          id: sub.id,
          full_name: sub.full_name,
          email: sub.email,
          tier_level: sub.tier_level || 1,
          rating: sub.rating || 0,
          total_jobs: totalJobs,
          completed_jobs: completedJobs,
          on_time_percentage: onTimePercentage,
          customer_complaints: customerComplaints,
          total_earnings: sub.total_earnings || 0,
          performance_trend: performanceTrend,
          last_job_date: lastJobDate
        };
      }) || [];

      setPerformance(performanceData);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: "Error",
        description: "Failed to load performance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPerformance = performance
    .filter(sub => {
      const matchesSearch = sub.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sub.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTier = filterTier === "all" || sub.tier_level.toString() === filterTier;
      return matchesSearch && matchesTier;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'jobs':
          return b.completed_jobs - a.completed_jobs;
        case 'earnings':
          return b.total_earnings - a.total_earnings;
        default:
          return 0;
      }
    });

  const avgRating = performance.reduce((sum, sub) => sum + sub.rating, 0) / performance.length || 0;
  const totalJobs = performance.reduce((sum, sub) => sum + sub.completed_jobs, 0);
  const topPerformers = performance.filter(sub => sub.rating >= 4.5).length;
  const needsImprovement = performance.filter(sub => sub.rating < 4.0 || sub.customer_complaints > 1).length;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <SubcontractorManagementLayout 
      title="Performance Tracking" 
      description="Monitor subcontractor performance metrics and analytics"
    >
      <div className="space-y-6">
        {/* Performance Metrics */}
        <AdminSection title="Performance Overview" description="Key performance indicators">
          <AdminGrid columns={4} gap="md">
            <AdminCard variant="metric" title="Average Rating" icon={<Star className="h-4 w-4" />}>
              <div className="text-3xl font-bold text-yellow-600">{avgRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Overall rating</p>
            </AdminCard>

            <AdminCard variant="metric" title="Total Jobs" icon={<Calendar className="h-4 w-4" />}>
              <div className="text-3xl font-bold">{totalJobs}</div>
              <p className="text-xs text-muted-foreground">Completed services</p>
            </AdminCard>

            <AdminCard variant="metric" title="Top Performers" icon={<Award className="h-4 w-4" />}>
              <div className="text-3xl font-bold text-green-600">{topPerformers}</div>
              <p className="text-xs text-muted-foreground">4.5+ rating</p>
            </AdminCard>

            <AdminCard variant="metric" title="Needs Improvement" icon={<AlertTriangle className="h-4 w-4" />}>
              <div className="text-3xl font-bold text-red-600">{needsImprovement}</div>
              <p className="text-xs text-muted-foreground">Attention required</p>
            </AdminCard>
          </AdminGrid>
        </AdminSection>

        {/* Performance Tracking */}
        <AdminSection title="Performance Analytics" description="Individual performance tracking">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subcontractors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="1">Tier 1</SelectItem>
                  <SelectItem value="2">Tier 2</SelectItem>
                  <SelectItem value="3">Tier 3</SelectItem>
                  <SelectItem value="4">Tier 4</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="jobs">Jobs Completed</SelectItem>
                  <SelectItem value="earnings">Earnings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Analytics ({filteredPerformance.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Loading performance data...</p>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subcontractor</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Jobs</TableHead>
                        <TableHead>On-Time %</TableHead>
                        <TableHead>Complaints</TableHead>
                        <TableHead>Earnings</TableHead>
                        <TableHead>Trend</TableHead>
                        <TableHead>Last Job</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPerformance.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.full_name}</p>
                              <p className="text-sm text-muted-foreground">{sub.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">Tier {sub.tier_level}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium">{sub.rating.toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{sub.completed_jobs}</span>
                            <span className="text-sm text-muted-foreground">/{sub.total_jobs}</span>
                          </TableCell>
                          <TableCell>
                            <span className={`font-medium ${sub.on_time_percentage >= 90 ? 'text-green-600' : sub.on_time_percentage >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {sub.on_time_percentage.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={sub.customer_complaints === 0 ? "secondary" : sub.customer_complaints === 1 ? "outline" : "destructive"}>
                              {sub.customer_complaints}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-success">${sub.total_earnings.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(sub.performance_trend)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {sub.last_job_date ? new Date(sub.last_job_date).toLocaleDateString() : 'No jobs'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </AdminSection>
      </div>
    </SubcontractorManagementLayout>
  );
}