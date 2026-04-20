import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Gift,
  Download,
  Search,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReferralStats {
  total_referrals: number;
  total_rewards: number;
  pending_rewards: number;
  conversion_rate: number;
}

interface ReferralRecord {
  id: string;
  referrer_name: string;
  referrer_email: string;
  referred_email: string;
  status: string;
  created_at: string;
  attributed_at?: string;
  reward_amount: number;
}

export const AdminReferrals: React.FC = () => {
  const [stats, setStats] = useState<ReferralStats>({
    total_referrals: 0,
    total_rewards: 0,
    pending_rewards: 0,
    conversion_rate: 0
  });
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30d');

  useEffect(() => {
    loadReferralData();
  }, [dateRange, statusFilter]);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      
      // Calculate date filter
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setFullYear(now.getFullYear() - 1);
      }

      // Build query
      let query = supabase
        .from('referrals')
        .select(`
          id,
          referred_email,
          status,
          created_at,
          attributed_at,
          customers!referrer_customer_id(first_name, last_name, email),
          referral_rewards(amount_cents)
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter.toUpperCase());
      }

      const { data: referralData, error } = await query;

      if (error) throw error;

      // Transform data
      const transformedReferrals: ReferralRecord[] = referralData?.map(ref => ({
        id: ref.id,
        referrer_name: `${ref.customers?.first_name || ''} ${ref.customers?.last_name || ''}`.trim(),
        referrer_email: ref.customers?.email || '',
        referred_email: ref.referred_email,
        status: ref.status,
        created_at: ref.created_at,
        attributed_at: ref.attributed_at,
        reward_amount: ref.referral_rewards?.[0]?.amount_cents || 0
      })) || [];

      setReferrals(transformedReferrals);

      // Calculate stats
      const totalReferrals = transformedReferrals.length;
      const totalRewards = transformedReferrals.reduce((sum, ref) => sum + ref.reward_amount, 0);
      const pendingRewards = transformedReferrals
        .filter(ref => ref.status === 'PENDING')
        .reduce((sum, ref) => sum + ref.reward_amount, 0);
      const bookedCount = transformedReferrals.filter(ref => ['BOOKED', 'REWARDED'].includes(ref.status)).length;
      const conversionRate = totalReferrals > 0 ? (bookedCount / totalReferrals) * 100 : 0;

      setStats({
        total_referrals: totalReferrals,
        total_rewards: totalRewards,
        pending_rewards: pendingRewards,
        conversion_rate: conversionRate
      });

    } catch (error: any) {
      console.error('Error loading referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const approveReferral = async (referralId: string) => {
    try {
      await supabase
        .from('referrals')
        .update({ status: 'REWARDED' })
        .eq('id', referralId);
      
      toast.success('Referral approved');
      loadReferralData();
    } catch (error) {
      toast.error('Failed to approve referral');
    }
  };

  const rejectReferral = async (referralId: string) => {
    try {
      await supabase
        .from('referrals')
        .update({ status: 'REJECTED' })
        .eq('id', referralId);
      
      toast.success('Referral rejected');
      loadReferralData();
    } catch (error) {
      toast.error('Failed to reject referral');
    }
  };

  const exportData = () => {
    const csv = [
      ['Referrer Name', 'Referrer Email', 'Referred Email', 'Status', 'Created At', 'Reward Amount'].join(','),
      ...referrals.map(ref => [
        ref.referrer_name,
        ref.referrer_email,
        ref.referred_email,
        ref.status,
        new Date(ref.created_at).toLocaleDateString(),
        `$${(ref.reward_amount / 100).toFixed(2)}`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referrals_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BOOKED': return 'bg-green-500';
      case 'REWARDED': return 'bg-blue-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'REJECTED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredReferrals = referrals.filter(ref => 
    ref.referrer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.referrer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.referred_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Referral Management</h1>
        <Button onClick={exportData} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{stats.total_referrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Rewards</p>
                <p className="text-2xl font-bold">${(stats.total_rewards / 100).toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Rewards</p>
                <p className="text-2xl font-bold">${(stats.pending_rewards / 100).toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{stats.conversion_rate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search referrals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="rewarded">Rewarded</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead>Referred Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReferrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{referral.referrer_name}</div>
                      <div className="text-sm text-muted-foreground">{referral.referrer_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{referral.referred_email}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(referral.status)} text-white`}>
                      {referral.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(referral.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    ${(referral.reward_amount / 100).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {referral.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => approveReferral(referral.id)}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => rejectReferral(referral.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};