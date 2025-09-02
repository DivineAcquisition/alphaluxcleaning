import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Download, 
  Lock, 
  DollarSign,
  Calendar,
  Clock,
  User,
  FileText
} from 'lucide-react';
import { usePayrollPeriods } from '@/hooks/usePayrollPeriods';

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState('periods');
  const { periods, records, loading } = usePayrollPeriods();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'locked': return 'secondary';
      case 'paid': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payroll</h1>
          <p className="text-muted-foreground">Manage payroll periods and contractor payments</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Period
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="periods">Payroll Periods</TabsTrigger>
          <TabsTrigger value="records">Current Records</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="space-y-4">
          <div className="grid gap-4">
            {periods?.map((period) => (
              <Card key={period.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {new Date(period.period_start).toLocaleDateString()} - {new Date(period.period_end).toLocaleDateString()}
                        </h3>
                        <Badge variant={getStatusColor(period.status)}>
                          {period.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          Total: $0
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Hours: 0
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          Records: {records?.length || 0}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <FileText className="h-4 w-4" />
                        View Records
                      </Button>
                      {period.status === 'open' && (
                        <Button variant="outline" size="sm" className="gap-2">
                          <Lock className="h-4 w-4" />
                          Lock Period
                        </Button>
                      )}
                      {period.status === 'locked' && (
                        <Button size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          Export CSV
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Select a payroll period to view records</p>
          </div>
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Payroll adjustments interface coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}