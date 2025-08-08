import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  // Key Metrics
  totalRevenue: number;
  monthlyRevenue: number;
  totalBookings: number;
  monthlyBookings: number;
  activeSubcontractors: number;
  averageRating: number;
  
  // Revenue Analytics
  revenueByMonth: Array<{ month: string; revenue: number; bookings: number }>;
  revenueByServiceType: Array<{ service_type: string; revenue: number; count: number }>;
  
  // Performance Metrics
  completionRate: number;
  responseTime: number;
  customerRetention: number;
  repeatCustomers: number;
  
  // Tier Analytics
  tierDistribution: Array<{ tier_name: string; count: number; revenue: number }>;
  tierPerformance: Array<{ tier_level: number; tier_name: string; avg_rating: number; completion_rate: number }>;
  
  // Customer Analytics
  totalCustomers: number;
  newCustomers: number;
  churnRate: number;
  satisfactionBreakdown: Array<{ rating: number; count: number; percentage: number }>;
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        ordersResult,
        bookingsResult,
        subcontractorsResult,
        feedbackResult
      ] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('bookings').select('*'),
        supabase.from('subcontractors').select('*'),
        supabase.from('customer_feedback').select('*')
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (bookingsResult.error) throw bookingsResult.error;
      if (subcontractorsResult.error) throw subcontractorsResult.error;
      if (feedbackResult.error) throw feedbackResult.error;

      const orders = ordersResult.data || [];
      const bookings = bookingsResult.data || [];
      const subcontractors = subcontractorsResult.data || [];
      const feedback = feedbackResult.data || [];

      // Calculate current date ranges
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Filter current month data
      const currentMonthOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      });

      const currentMonthBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.created_at);
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      });

      // Calculate key metrics
      const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0) / 100;
      const monthlyRevenue = currentMonthOrders.reduce((sum, order) => sum + (order.amount || 0), 0) / 100;
      const activeSubcontractors = subcontractors.filter(sub => sub.is_available && sub.subscription_status === 'active').length;
      const averageRating = feedback.length > 0 
        ? feedback.reduce((sum, f) => sum + (f.overall_rating || 0), 0) / feedback.length 
        : 0;

      // Calculate revenue by month (last 6 months)
      const revenueByMonth = [];
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(currentYear, currentMonth - i, 1);
        const monthOrders = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === targetDate.getMonth() && 
                 orderDate.getFullYear() === targetDate.getFullYear();
        });
        
        revenueByMonth.push({
          month: targetDate.toLocaleDateString('en-US', { month: 'short' }),
          revenue: monthOrders.reduce((sum, order) => sum + (order.amount || 0), 0) / 100,
          bookings: monthOrders.length
        });
      }

      // Calculate revenue by service type
      const serviceTypeRevenue: Record<string, { revenue: number; count: number }> = {};
      orders.forEach(order => {
        const serviceType = order.cleaning_type || 'regular';
        if (!serviceTypeRevenue[serviceType]) {
          serviceTypeRevenue[serviceType] = { revenue: 0, count: 0 };
        }
        serviceTypeRevenue[serviceType].revenue += (order.amount || 0) / 100;
        serviceTypeRevenue[serviceType].count += 1;
      });

      const revenueByServiceType = Object.entries(serviceTypeRevenue).map(([service_type, data]) => ({
        service_type: service_type.charAt(0).toUpperCase() + service_type.slice(1),
        revenue: data.revenue,
        count: data.count
      }));

      // Calculate tier distribution
      const tierStats: Record<number, { tier_name: string; count: number; revenue: number }> = {};
      subcontractors.forEach(sub => {
        const tierLevel = sub.tier_level || 1;
        const tierName = tierLevel === 3 ? 'Elite' : tierLevel === 2 ? 'Professional' : 'Standard';
        
        if (!tierStats[tierLevel]) {
          tierStats[tierLevel] = { tier_name: tierName, count: 0, revenue: 0 };
        }
        tierStats[tierLevel].count += 1;
        tierStats[tierLevel].revenue += sub.monthly_fee || 0;
      });

      const tierDistribution = Object.values(tierStats);

      // Calculate tier performance
      const tierPerformance = Object.entries(tierStats).map(([tierLevel, data]) => {
        const tierSubs = subcontractors.filter(sub => (sub.tier_level || 1) === parseInt(tierLevel));
        const avgRating = tierSubs.length > 0 
          ? tierSubs.reduce((sum, sub) => sum + (sub.rating || 0), 0) / tierSubs.length 
          : 0;
        
        return {
          tier_level: parseInt(tierLevel),
          tier_name: data.tier_name,
          avg_rating: avgRating,
          completion_rate: 95 + (parseInt(tierLevel) * 2) // Mock completion rate
        };
      });

      // Calculate satisfaction breakdown
      const ratingCounts: Record<number, number> = {};
      feedback.forEach(f => {
        const rating = Math.round(f.overall_rating || 0);
        ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
      });

      const satisfactionBreakdown = Object.entries(ratingCounts).map(([rating, count]) => ({
        rating: parseInt(rating),
        count,
        percentage: feedback.length > 0 ? (count / feedback.length) * 100 : 0
      })).sort((a, b) => b.rating - a.rating);

      // Calculate unique customers
      const uniqueCustomers = new Set(orders.map(order => order.customer_email)).size;
      const currentMonthUniqueCustomers = new Set(currentMonthOrders.map(order => order.customer_email)).size;

      const analyticsData: AnalyticsData = {
        totalRevenue,
        monthlyRevenue,
        totalBookings: bookings.length,
        monthlyBookings: currentMonthBookings.length,
        activeSubcontractors,
        averageRating,
        revenueByMonth,
        revenueByServiceType,
        completionRate: 94.5, // Mock data
        responseTime: 2.4, // Mock data in hours
        customerRetention: 78, // Mock data percentage
        repeatCustomers: orders.filter(order => 
          orders.some(other => other.customer_email === order.customer_email && other.id !== order.id)
        ).length,
        tierDistribution,
        tierPerformance,
        totalCustomers: uniqueCustomers,
        newCustomers: currentMonthUniqueCustomers,
        churnRate: 8.2, // Mock data percentage
        satisfactionBreakdown
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analytics,
    loading,
    refreshAnalytics: fetchAnalytics
  };
}