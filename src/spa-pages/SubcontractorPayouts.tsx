import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSubcontractorEarnings } from '@/hooks/useSubcontractorEarnings';
import { StatusChip } from '@/components/earnings/StatusChip';
import { 
  ArrowLeft,
  Clock,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Banknote,
  Info
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface PayoutBatchCardProps {
  batch: any;
}

function PayoutBatchCard({ batch }: PayoutBatchCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-amber-600" />;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payment completed successfully';
      case 'processing':
        return 'Payment is being processed';
      case 'failed':
        return 'Payment failed - contact support';
      case 'open':
        return 'Collecting jobs for next payout';
      default:
        return 'Status unknown';
    }
  };

  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getStatusIcon(batch.status)}
                    Payout Period
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(batch.period_start), 'MMM dd')} - {format(new Date(batch.period_end), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <StatusChip status={batch.status} />
                </div>
                <div className="text-lg font-bold text-primary">
                  ${batch.total_amount.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {batch.items?.length || 0} jobs
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                {getStatusDescription(batch.status)}
              </div>

              {batch.items && batch.items.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Jobs in this payout:</h4>
                  
                  {batch.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {format(new Date(item.job_details.service_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.job_details.customer_name} • {item.job_details.service_address}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold">${item.amount.toFixed(2)}</div>
                        <StatusChip status={item.status} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
                <span>Created: {format(new Date(batch.created_at), 'MMM dd, yyyy')}</span>
                {batch.status === 'paid' && (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    ✓ Payment completed
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function SubcontractorPayouts() {
  const { payoutBatches, overview, loading } = useSubcontractorEarnings();

  // Calculate next payout window (typically weekly)
  const nextPayoutDate = new Date();
  nextPayoutDate.setDate(nextPayoutDate.getDate() + (7 - nextPayoutDate.getDay())); // Next Sunday

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/earnings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Earnings
          </Link>
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Payout Tracker
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your payout history and upcoming payments
          </p>
        </div>
      </div>

      {/* Payout Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Banknote className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                  Pending Payout
                </h2>
              </div>
              <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300">
                {differenceInDays(nextPayoutDate, new Date())} days left
              </Badge>
            </div>
            
            <div className="text-3xl font-bold text-amber-800 dark:text-amber-300 mb-2">
              ${overview?.pendingAmount.toFixed(2) || '0.00'}
            </div>
            
            <div className="text-sm text-amber-600 dark:text-amber-400 mb-4">
              From completed jobs awaiting payout
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Next payout window:</span>
                <span className="font-medium">
                  {format(nextPayoutDate, 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payout method:</span>
                <span className="font-medium">Bank Transfer</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-semibold text-green-800 dark:text-green-300">
                Total Paid Out
              </h2>
            </div>
            
            <div className="text-3xl font-bold text-green-800 dark:text-green-300 mb-2">
              ${(overview?.totalEarnings || 0) - (overview?.pendingAmount || 0) > 0 ? 
                ((overview?.totalEarnings || 0) - (overview?.pendingAmount || 0)).toFixed(2) : 
                '0.00'}
            </div>
            
            <div className="text-sm text-green-600 dark:text-green-400 mb-4">
              Successfully transferred to your account
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Last payout:</span>
                <span className="font-medium">
                  {payoutBatches.find(b => b.status === 'paid') ? 
                    format(new Date(payoutBatches.find(b => b.status === 'paid')!.created_at), 'MMM dd, yyyy') :
                    'No payouts yet'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total payouts:</span>
                <span className="font-medium">
                  {payoutBatches.filter(b => b.status === 'paid').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Payout History</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            Payouts are processed weekly
          </div>
        </div>

        {payoutBatches.length > 0 ? (
          <div className="space-y-4">
            {payoutBatches.map((batch) => (
              <PayoutBatchCard key={batch.id} batch={batch} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Banknote className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payouts yet</h3>
              <p className="text-muted-foreground text-center">
                Complete some jobs to start receiving payouts. Payouts are typically processed weekly.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Help Section */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                How payouts work
              </h3>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>• Payouts are processed weekly, typically on Sundays</p>
                <p>• Completed jobs are included in the next available payout batch</p>
                <p>• Payments are transferred to your linked bank account within 2-3 business days</p>
                <p>• You'll receive an email notification when your payout is processed</p>
              </div>
              
              <Button variant="outline" size="sm" className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300">
                Update Payment Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}