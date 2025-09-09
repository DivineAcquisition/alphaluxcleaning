import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSubcontractorEarnings } from '@/hooks/useSubcontractorEarnings';
import { StatusChip } from '@/components/earnings/StatusChip';
import { TipBadge } from '@/components/earnings/TipBadge';
import { RatingBadge } from '@/components/earnings/RatingBadge';
import { 
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  DollarSign,
  Filter,
  Download,
  Eye,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

interface JobRowProps {
  job: any;
  onViewDetails: (job: any) => void;
}

function JobRow({ job, onViewDetails }: JobRowProps) {
  return (
    <Card className="mb-4 hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {format(new Date(job.service_date), 'MMM dd, yyyy')}
              </span>
              <span className="text-muted-foreground">at {job.service_time}</span>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{job.service_address}</span>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">{job.customer_name}</span>
              {job.estimated_duration && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{job.estimated_duration} min</span>
                </>
              )}
            </div>
          </div>
          
          <div className="text-right space-y-2">
            <div className="flex items-center gap-2">
              {job.rating && <RatingBadge rating={job.rating} size="sm" />}
              <StatusChip status={job.payout_status} size="sm" />
            </div>
            
            <div className="space-y-1">
              <div className="text-lg font-bold text-primary">
                ${job.total_amount.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                Base: ${job.subcontractor_payout_amount.toFixed(2)}
                {job.gratuity_amount > 0 && (
                  <div className="text-green-600 dark:text-green-400">
                    +${job.gratuity_amount.toFixed(2)} tip
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {job.special_instructions && (
          <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/10 rounded border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Instructions:</strong> {job.special_instructions}
            </p>
          </div>
        )}

        {job.rating_note && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/10 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Customer Feedback:</strong> {job.rating_note}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <TipBadge amount={job.gratuity_amount} size="sm" />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(job)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SubcontractorEarningsHistory() {
  const { jobHistory, loading, fetchJobHistory, subcontractorId } = useSubcontractorEarnings();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [filters, setFilters] = useState({
    dateRange: 'last_30',
    payoutStatus: 'all',
    minRating: 'all',
    search: ''
  });

  const applyFilters = async () => {
    if (!subcontractorId) return;

    const filterOptions: any = {};
    
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const days = filters.dateRange === 'last_7' ? 7 : filters.dateRange === 'last_30' ? 30 : 90;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filterOptions.startDate = startDate.toISOString();
    }
    
    if (filters.payoutStatus !== 'all') {
      filterOptions.payoutStatus = filters.payoutStatus;
    }
    
    if (filters.minRating !== 'all') {
      filterOptions.minRating = parseInt(filters.minRating);
    }

    await fetchJobHistory(subcontractorId, filterOptions);
  };

  const filteredJobs = jobHistory.filter(job => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        job.customer_name.toLowerCase().includes(searchLower) ||
        job.service_address.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const totalEarnings = filteredJobs.reduce((sum, job) => sum + job.total_amount, 0);
  const totalJobs = filteredJobs.length;

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-2 bg-muted rounded"></div>
                  <div className="h-2 bg-muted rounded w-2/3"></div>
                </div>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/earnings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Earnings
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Earnings History
            </h1>
            <p className="text-muted-foreground mt-1">
              Complete history of your completed jobs and earnings
            </p>
          </div>
        </div>
        
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Customer or address..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7">Last 7 days</SelectItem>
                  <SelectItem value="last_30">Last 30 days</SelectItem>
                  <SelectItem value="last_90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Payout Status</label>
              <Select
                value={filters.payoutStatus}
                onValueChange={(value) => setFilters(prev => ({ ...prev, payoutStatus: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Rating</label>
              <Select
                value={filters.minRating}
                onValueChange={(value) => setFilters(prev => ({ ...prev, minRating: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ratings</SelectItem>
                  <SelectItem value="5">5 stars</SelectItem>
                  <SelectItem value="4">4+ stars</SelectItem>
                  <SelectItem value="3">3+ stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={applyFilters} className="w-full md:w-auto">
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total Earnings</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{totalJobs}</div>
            <div className="text-sm text-muted-foreground">Jobs Completed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">
              ${totalJobs > 0 ? (totalEarnings / totalJobs).toFixed(2) : '0.00'}
            </div>
            <div className="text-sm text-muted-foreground">Avg per Job</div>
          </CardContent>
        </Card>
      </div>

      {/* Job History */}
      <div className="space-y-4">
        {filteredJobs.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Job History ({filteredJobs.length} jobs)</h2>
            </div>
            
            {filteredJobs.map((job) => (
              <JobRow 
                key={job.id} 
                job={job} 
                onViewDetails={setSelectedJob}
              />
            ))}
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground text-center">
                {filters.search || filters.payoutStatus !== 'all' || filters.minRating !== 'all' ? 
                  'No jobs match your current filters. Try adjusting your search criteria.' :
                  'You haven\'t completed any jobs yet. Keep up the great work!'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}