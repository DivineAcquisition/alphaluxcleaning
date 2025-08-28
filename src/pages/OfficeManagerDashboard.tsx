import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, BarChart3, AlertCircle } from 'lucide-react';

export default function OfficeManagerDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Office Manager Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {user?.email}</p>
          </div>
          <Button>View Reports</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">teams in field</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Jobs</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">scheduled cleanings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">require attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Status</CardTitle>
              <CardDescription>Current team assignments and availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Team Alpha</p>
                    <p className="text-sm text-muted-foreground">Downtown - 3 jobs today</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Team Beta</p>
                    <p className="text-sm text-muted-foreground">Mission Bay - 2 jobs today</p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Break</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Team Gamma</p>
                    <p className="text-sm text-muted-foreground">Available for assignment</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Available</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Priority Tasks</CardTitle>
              <CardDescription>Items requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg border-red-200">
                  <div>
                    <p className="font-medium text-red-800">Schedule Conflict</p>
                    <p className="text-sm text-muted-foreground">Team overlap at 2 PM</p>
                  </div>
                  <Button variant="outline" size="sm">Resolve</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg border-yellow-200">
                  <div>
                    <p className="font-medium text-yellow-800">Supply Request</p>
                    <p className="text-sm text-muted-foreground">Team needs cleaning supplies</p>
                  </div>
                  <Button variant="outline" size="sm">Review</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg border-blue-200">
                  <div>
                    <p className="font-medium text-blue-800">Customer Feedback</p>
                    <p className="text-sm text-muted-foreground">5 reviews to process</p>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}