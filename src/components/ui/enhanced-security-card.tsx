import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface EnhancedSecurityCardProps {
  title: string;
  description?: string;
  status: 'secure' | 'warning' | 'critical' | 'pending';
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  lastUpdate?: string;
  children?: React.ReactNode;
}

export function EnhancedSecurityCard({
  title,
  description,
  status,
  value,
  trend,
  lastUpdate,
  children
}: EnhancedSecurityCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'secure':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'secure': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      case 'pending': return 'outline';
      default: return 'default';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-destructive';
      case 'stable': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusColor()}>
            {status}
          </Badge>
          {getStatusIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-2xl font-bold">{value}</div>
            {lastUpdate && (
              <p className="text-xs text-muted-foreground">
                Updated {lastUpdate}
              </p>
            )}
          </div>
          {trend && (
            <div className={`text-sm font-medium ${getTrendColor()}`}>
              {trend === 'up' && '↗'}
              {trend === 'down' && '↘'}
              {trend === 'stable' && '→'}
            </div>
          )}
        </div>
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}