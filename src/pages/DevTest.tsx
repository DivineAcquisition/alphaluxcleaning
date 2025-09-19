import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  TestTube, 
  Database, 
  CreditCard, 
  Webhook, 
  PlayCircle,
  Settings,
  BarChart3,
  Users
} from 'lucide-react';

export function DevTest() {
  const navigate = useNavigate();

  const testModules = [
    {
      title: 'Test Scenarios',
      description: 'Pre-built booking scenarios for comprehensive testing',
      icon: TestTube,
      path: '/dev-test/scenarios',
      color: 'bg-blue-500',
      status: 'active'
    },
    {
      title: 'Database Inspector',
      description: 'View and manage test bookings, customers, and payments',
      icon: Database,
      path: '/dev-test/database',
      color: 'bg-green-500',
      status: 'active'
    },
    {
      title: 'Payment Testing',
      description: 'Test payment flows with various scenarios',
      icon: CreditCard,
      path: '/dev-test/payments',
      color: 'bg-purple-500',
      status: 'active'
    },
    {
      title: 'Webhook Testing',
      description: 'Test integration webhooks and external APIs',
      icon: Webhook,
      path: '/dev-test/webhooks',
      color: 'bg-orange-500',
      status: 'active'
    }
  ];

  const quickActions = [
    {
      title: 'Start Live Booking Test',
      description: 'Test the complete booking flow end-to-end',
      action: () => navigate('/?test=true'),
      icon: PlayCircle,
      color: 'bg-emerald-500'
    },
    {
      title: 'View Analytics',
      description: 'Check booking conversion and success rates',
      action: () => navigate('/admin/analytics'),
      icon: BarChart3,
      color: 'bg-cyan-500'
    },
    {
      title: 'Customer Management',
      description: 'View and manage test customer profiles',
      action: () => navigate('/dev-test/database?tab=customers'),
      icon: Users,
      color: 'bg-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Helmet>
        <title>Dev Test Dashboard - AlphaLux Cleaning</title>
        <meta name="description" content="Comprehensive testing dashboard for AlphaLux Cleaning booking system" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">
              Dev Test Dashboard
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Comprehensive testing environment for the AlphaLux Cleaning booking system.
            Test all flows, inspect data, and validate integrations.
          </p>
          <Badge variant="secondary" className="mt-4">
            Development Environment
          </Badge>
        </div>

        {/* Test Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {testModules.map((module, index) => {
            const IconComponent = module.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${module.color} text-white`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-xl">{module.title}</CardTitle>
                    </div>
                    <Badge variant={module.status === 'active' ? 'default' : 'secondary'}>
                      {module.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{module.description}</p>
                  <Button 
                    onClick={() => navigate(module.path)}
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    variant="outline"
                  >
                    Open Module
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <Button
                    key={index}
                    onClick={action.action}
                    variant="outline"
                    className="h-auto p-4 text-left flex-col items-start hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded ${action.color} text-white`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{action.title}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{action.description}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Badge variant="default" className="mb-2">Active</Badge>
                <p className="text-sm text-muted-foreground">Database</p>
              </div>
              <div className="text-center">
                <Badge variant="default" className="mb-2">Active</Badge>
                <p className="text-sm text-muted-foreground">Stripe</p>
              </div>
              <div className="text-center">
                <Badge variant="default" className="mb-2">Active</Badge>
                <p className="text-sm text-muted-foreground">Edge Functions</p>
              </div>
              <div className="text-center">
                <Badge variant="default" className="mb-2">Active</Badge>
                <p className="text-sm text-muted-foreground">Webhooks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}