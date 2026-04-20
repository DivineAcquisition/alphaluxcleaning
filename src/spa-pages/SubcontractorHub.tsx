import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Settings, 
  BarChart3,
  Calendar,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { SubcontractorManagementLayout } from '@/components/admin/SubcontractorManagementLayout';
import { SubcontractorDirectory } from '@/components/subcontractor-hub/SubcontractorDirectory';
import { ApplicationsOnboarding } from '@/components/subcontractor-hub/ApplicationsOnboarding';
import { JobAssignmentCenter } from '@/components/subcontractor-hub/JobAssignmentCenter';
import { PerformanceAnalytics } from '@/components/subcontractor-hub/PerformanceAnalytics';
import { OperationsManagement } from '@/components/subcontractor-hub/OperationsManagement';
import { HubOverview } from '@/components/subcontractor-hub/HubOverview';
import { useSubcontractorHub } from '@/hooks/useSubcontractorHub';

export default function SubcontractorHub() {
  const [activeTab, setActiveTab] = useState('overview');
  const { hubData, loading, refreshData } = useSubcontractorHub();

  if (loading) {
    return (
      <SubcontractorManagementLayout title="Subcontractor Management Hub" description="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading subcontractor management hub...</p>
          </div>
        </div>
      </SubcontractorManagementLayout>
    );
  }

  const stats = hubData?.stats || {
    total: 0,
    active: 0,
    applications: 0,
    unassignedJobs: 0,
    alerts: 0,
    avgRating: 0
  };

  return (
    <SubcontractorManagementLayout 
      title="Subcontractor Management Hub" 
      description="Comprehensive subcontractor operations management center"
    >
      <div className="space-y-6">
        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subcontractors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All statuses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Working now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.applications}</div>
              <p className="text-xs text-muted-foreground">Pending review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned Jobs</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unassignedJobs}</div>
              <p className="text-xs text-muted-foreground">Need assignment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.alerts}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.avgRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Overall performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Hub Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="directory" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Directory
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Applications
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Assignments
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="operations" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Operations
              </TabsTrigger>
            </TabsList>
            
            <Button onClick={refreshData} variant="outline" size="sm">
              Refresh Data
            </Button>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <HubOverview data={hubData} />
          </TabsContent>

          <TabsContent value="directory" className="space-y-6">
            <SubcontractorDirectory data={hubData?.subcontractors} />
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <ApplicationsOnboarding data={hubData?.applications} />
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <JobAssignmentCenter data={hubData?.assignments} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <PerformanceAnalytics data={hubData?.analytics} />
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <OperationsManagement data={hubData} />
          </TabsContent>
        </Tabs>
      </div>
    </SubcontractorManagementLayout>
  );
}