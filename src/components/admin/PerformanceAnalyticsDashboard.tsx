import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  AlertTriangle, 
  Star,
  Calendar,
  DollarSign,
  Activity,
  Award,
  UserCheck,
  UserX
} from 'lucide-react';
import { useSubcontractorPerformance } from '@/hooks/useSubcontractorPerformance';
import { useAutomatedTierProgression } from '@/hooks/useAutomatedTierProgression';

export function PerformanceAnalyticsDashboard() {
  const { performance, loading, flagSubcontractor } = useSubcontractorPerformance();
  const { processAllSubcontractors, isProcessing } = useAutomatedTierProgression();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalSubcontractors = performance.length;
  const activeSubcontractors = performance.filter(p => p.is_available).length;
  const averageRating = performance.reduce((sum, p) => sum + p.rating, 0) / totalSubcontractors || 0;
  const totalComplaints = performance.reduce((sum, p) => sum + p.complaints, 0);
  const topPerformers = performance.filter(p => p.rating >= 4.5 && p.complaints === 0).length;
  const needsAttention = performance.filter(p => p.rating < 3.5 || p.complaints > 2).length;
  const riskSubcontractors = performance.filter(p => p.trend === 'down' && p.complaints > 1);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPerformanceColor = (rating: number, complaints: number) => {
    if (rating >= 4.5 && complaints === 0) return 'text-green-600 bg-green-50';
    if (rating < 3.5 || complaints > 2) return 'text-red-600 bg-red-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Subcontractors</p>
                <p className="text-2xl font-bold">{totalSubcontractors}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <UserCheck className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">{activeSubcontractors} active</span>
              <span className="text-muted-foreground ml-2">({Math.round(activeSubcontractors / totalSubcontractors * 100)}%)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="mt-2">
              <Progress value={averageRating * 20} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Performers</p>
                <p className="text-2xl font-bold text-green-600">{topPerformers}</p>
              </div>
              <Award className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              4.5+ rating, 0 complaints
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Need Attention</p>
                <p className="text-2xl font-bold text-red-600">{needsAttention}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Low rating or high complaints
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          
          <Button 
            onClick={() => processAllSubcontractors(true)}
            disabled={isProcessing}
            className="ml-auto"
          >
            <Activity className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Sync All Tiers'}
          </Button>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Distribution</CardTitle>
              <CardDescription>Subcontractor performance breakdown by rating and complaints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-600">{topPerformers}</div>
                  <div className="text-sm text-green-700">Excellent (4.5+ rating)</div>
                  <div className="text-xs text-muted-foreground">0 complaints</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-yellow-50">
                  <div className="text-2xl font-bold text-yellow-600">
                    {totalSubcontractors - topPerformers - needsAttention}
                  </div>
                  <div className="text-sm text-yellow-700">Good (3.5-4.4 rating)</div>
                  <div className="text-xs text-muted-foreground">1-2 complaints</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-red-50">
                  <div className="text-2xl font-bold text-red-600">{needsAttention}</div>
                  <div className="text-sm text-red-700">Needs Attention</div>
                  <div className="text-xs text-muted-foreground">&lt;3.5 rating or 3+ complaints</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Individual Performance</CardTitle>
              <CardDescription>Detailed performance metrics for each subcontractor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performance.slice(0, 10).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{sub.full_name}</div>
                        <div className="text-sm text-muted-foreground">{sub.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="font-medium">{sub.rating}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{sub.totalReviews} reviews</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium">{sub.jobsCompleted}</div>
                        <div className="text-xs text-muted-foreground">jobs completed</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium text-red-600">{sub.complaints}</div>
                        <div className="text-xs text-muted-foreground">complaints</div>
                      </div>
                      
                      <div className="flex items-center">
                        {getTrendIcon(sub.trend)}
                      </div>
                      
                      <Badge className={getPerformanceColor(sub.rating, sub.complaints)}>
                        {sub.is_available ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Analysis</CardTitle>
              <CardDescription>Subcontractors requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {riskSubcontractors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No high-risk subcontractors identified</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {riskSubcontractors.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-center space-x-4">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                        <div>
                          <div className="font-semibold text-red-900">{sub.full_name}</div>
                          <div className="text-sm text-red-700">
                            Rating: {sub.rating} | Complaints: {sub.complaints} | Trend: Declining
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => flagSubcontractor(sub.id, 'Performance declining with multiple complaints')}
                      >
                        Flag for Review
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automated Recommendations</CardTitle>
              <CardDescription>AI-powered suggestions for subcontractor management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {needsAttention > 0 && (
                  <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="font-semibold text-yellow-900">Performance Review Needed</span>
                    </div>
                    <p className="text-sm text-yellow-800 mb-3">
                      {needsAttention} subcontractors have performance issues that need addressing.
                    </p>
                    <Button variant="outline" size="sm">Schedule Performance Reviews</Button>
                  </div>
                )}

                {topPerformers > 0 && (
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center mb-2">
                      <Award className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-semibold text-green-900">Recognition Opportunity</span>
                    </div>
                    <p className="text-sm text-green-800 mb-3">
                      {topPerformers} subcontractors are performing excellently. Consider recognition or tier upgrades.
                    </p>
                    <Button variant="outline" size="sm">Send Recognition Emails</Button>
                  </div>
                )}

                {activeSubcontractors / totalSubcontractors < 0.8 && (
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-center mb-2">
                      <UserX className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-semibold text-blue-900">Reactivation Campaign</span>
                    </div>
                    <p className="text-sm text-blue-800 mb-3">
                      Only {Math.round(activeSubcontractors / totalSubcontractors * 100)}% of subcontractors are active. 
                      Consider a reactivation campaign.
                    </p>
                    <Button variant="outline" size="sm">Launch Reactivation Campaign</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}