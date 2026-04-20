import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  Search,
  Filter,
  Award,
  Star,
  MessageSquare
} from "lucide-react";

interface TipData {
  id: string;
  amount: number;
  customer_message?: string;
  created_at: string;
  tip_type: string;
  distribution_method: string;
  order: {
    customer_name: string;
    customer_email: string;
  };
  subcontractor: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface TipAnalytics {
  totalTips: number;
  totalAmount: number;
  averageTip: number;
  topPerformer: string;
  recentTips: TipData[];
  monthlyTrend: number;
}

export default function TipsManagement() {
  const [tips, setTips] = useState<TipData[]>([]);
  const [analytics, setAnalytics] = useState<TipAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterSubcontractor, setFilterSubcontractor] = useState("all");

  useEffect(() => {
    fetchTipsData();
  }, []);

  const fetchTipsData = async () => {
    try {
      const { data: tipsData, error: tipsError } = await supabase
        .from('order_tips')
        .select(`
          id,
          amount,
          customer_message,
          created_at,
          tip_type,
          distribution_method,
          order:orders(customer_name, customer_email),
          subcontractor:subcontractors(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (tipsError) throw tipsError;

      setTips(tipsData || []);
      calculateAnalytics(tipsData || []);
    } catch (error) {
      console.error('Error fetching tips data:', error);
      toast.error('Failed to load tips data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (tipsData: TipData[]) => {
    const totalAmount = tipsData.reduce((sum, tip) => sum + tip.amount, 0);
    const averageTip = tipsData.length > 0 ? totalAmount / tipsData.length : 0;
    
    // Find top performer by total tips received
    const subcontractorTips = tipsData.reduce((acc, tip) => {
      const subId = tip.subcontractor.id;
      acc[subId] = (acc[subId] || 0) + tip.amount;
      return acc;
    }, {} as Record<string, number>);

    const topPerformerId = Object.entries(subcontractorTips)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    const topPerformer = tipsData.find(tip => tip.subcontractor.id === topPerformerId)?.subcontractor.full_name || 'N/A';

    // Calculate monthly trend (simplified)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthTips = tipsData.filter(tip => 
      new Date(tip.created_at) >= thisMonth
    ).reduce((sum, tip) => sum + tip.amount, 0);

    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthTips = tipsData.filter(tip => {
      const tipDate = new Date(tip.created_at);
      return tipDate >= lastMonth && tipDate < thisMonth;
    }).reduce((sum, tip) => sum + tip.amount, 0);

    const monthlyTrend = lastMonthTips > 0 ? ((thisMonthTips - lastMonthTips) / lastMonthTips) * 100 : 0;

    setAnalytics({
      totalTips: tipsData.length,
      totalAmount,
      averageTip,
      topPerformer,
      recentTips: tipsData.slice(0, 10),
      monthlyTrend
    });
  };

  const filteredTips = tips.filter(tip => {
    const matchesSearch = tip.subcontractor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tip.order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPeriod = filterPeriod === "all" || 
      (filterPeriod === "week" && new Date(tip.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (filterPeriod === "month" && new Date(tip.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    const matchesSubcontractor = filterSubcontractor === "all" || tip.subcontractor.id === filterSubcontractor;

    return matchesSearch && matchesPeriod && matchesSubcontractor;
  });

  const uniqueSubcontractors = [...new Set(tips.map(tip => tip.subcontractor))];

  if (loading) {
    return (
      <AdminLayout title="Tips Management" description="Loading tips data...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Tips Management" 
      description="Monitor and manage customer tips and appreciation"
    >
      <div className="space-y-6">
        {/* Analytics Overview */}
        {analytics && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tips</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalTips}</div>
                <p className="text-xs text-muted-foreground">All time tips received</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${analytics.totalAmount.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.monthlyTrend >= 0 ? '+' : ''}{analytics.monthlyTrend.toFixed(1)}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Tip</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  ${analytics.averageTip.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Per tip received</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                <Award className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-purple-600">
                  {analytics.topPerformer}
                </div>
                <p className="text-xs text-muted-foreground">Highest tips received</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Tips</CardTitle>
            <CardDescription>Search and filter tip records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by customer or subcontractor..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSubcontractor} onValueChange={setFilterSubcontractor}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by subcontractor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcontractors</SelectItem>
                  {uniqueSubcontractors.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterPeriod("all");
                  setFilterSubcontractor("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips Data */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Tips List</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Tips</CardTitle>
                <CardDescription>
                  {filteredTips.length} tips found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTips.map((tip) => (
                    <div key={tip.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tip.order.customer_name}</span>
                          <Badge variant="outline">to</Badge>
                          <span className="font-medium text-primary">{tip.subcontractor.full_name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{tip.order.customer_email}</p>
                        {tip.customer_message && (
                          <div className="flex items-start gap-2 mt-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <p className="text-sm italic text-muted-foreground">"{tip.customer_message}"</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(tip.created_at).toLocaleDateString()} at {new Date(tip.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          ${tip.amount.toFixed(2)}
                        </div>
                        <Badge variant="secondary" className="mt-1">
                          {tip.tip_type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {filteredTips.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No tips found</p>
                      <p className="text-sm">Try adjusting your search criteria or filters</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tips Analytics</CardTitle>
                <CardDescription>Detailed insights into tip patterns and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Top Performing Subcontractors</h3>
                    <div className="space-y-2">
                      {uniqueSubcontractors
                        .map(sub => ({
                          ...sub,
                          totalTips: tips.filter(tip => tip.subcontractor.id === sub.id).reduce((sum, tip) => sum + tip.amount, 0),
                          tipCount: tips.filter(tip => tip.subcontractor.id === sub.id).length
                        }))
                        .sort((a, b) => b.totalTips - a.totalTips)
                        .slice(0, 5)
                        .map((sub, index) => (
                          <div key={sub.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant={index === 0 ? "default" : "secondary"}>
                                #{index + 1}
                              </Badge>
                              <span className="font-medium">{sub.full_name}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">${sub.totalTips.toFixed(2)}</div>
                              <div className="text-sm text-muted-foreground">{sub.tipCount} tips</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}