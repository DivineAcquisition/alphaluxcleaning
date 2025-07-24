import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Users, DollarSign } from "lucide-react";

export function DashboardHeader() {
  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          CleanPrice Pro
        </h1>
        <p className="text-xl text-muted-foreground">
          Instant pricing calculator for professional cleaning services
        </p>
        <Badge variant="secondary" className="mt-2">
          <Sparkles className="h-3 w-3 mr-1" />
          Real-time calculations
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">$2,450</p>
              <p className="text-sm text-muted-foreground">Avg Monthly Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-success/10 rounded-lg mr-4">
              <Users className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">127</p>
              <p className="text-sm text-muted-foreground">Active Clients</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">18%</p>
              <p className="text-sm text-muted-foreground">Growth This Month</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}