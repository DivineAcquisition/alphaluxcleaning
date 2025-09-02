import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PayrollPeriod {
  id: string;
  period_start: string;
  period_end: string;
  status: 'open' | 'locked' | 'paid';
  totals_json: any;
  created_at: string;
  updated_at: string;
}

export interface PayrollRecord {
  id: string;
  payroll_period_id: string;
  contractor_id: string;
  job_id?: string;
  timesheet_id?: string;
  pay_type: 'hourly' | 'flat' | 'commission' | 'overtime';
  units: number;
  rate: number;
  bonus: number;
  deduction: number;
  pay_calc: number;
  status: 'pending' | 'approved' | 'sent' | 'completed' | 'disputed';
  approved_by?: string;
  approved_at?: string;
  memo?: string;
  contractor?: {
    full_name: string;
    email: string;
  };
}

export function usePayrollPeriods() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPayrollPeriods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .order('period_start', { ascending: false });

      if (error) throw error;
      setPeriods(data || []);
    } catch (error) {
      console.error('Error fetching payroll periods:', error);
      toast({
        title: "Error",
        description: "Failed to load payroll periods",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollRecords = async (periodId: string) => {
    try {
      const { data, error } = await supabase
        .from('payroll_records')
        .select(`
          *,
          subcontractors:contractor_id (
            full_name,
            email
          )
        `)
        .eq('payroll_period_id', periodId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRecords: PayrollRecord[] = (data || []).map(record => ({
        id: record.id,
        payroll_period_id: record.payroll_period_id,
        contractor_id: record.contractor_id,
        job_id: record.job_id,
        timesheet_id: record.timesheet_id,
        pay_type: record.pay_type,
        units: record.units,
        rate: record.rate,
        bonus: record.bonus,
        deduction: record.deduction,
        pay_calc: record.pay_calc,
        status: record.status,
        approved_by: record.approved_by,
        approved_at: record.approved_at,
        memo: record.memo,
        contractor: record.subcontractors
      }));

      setRecords(formattedRecords);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
      toast({
        title: "Error",
        description: "Failed to load payroll records",
        variant: "destructive",
      });
    }
  };

  const createPayrollPeriod = async (periodStart: string, periodEnd: string) => {
    try {
      const { error } = await supabase
        .from('payroll_periods')
        .insert({
          period_start: periodStart,
          period_end: periodEnd,
          status: 'open'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payroll period created successfully",
      });

      fetchPayrollPeriods();
    } catch (error) {
      console.error('Error creating payroll period:', error);
      toast({
        title: "Error",
        description: "Failed to create payroll period",
        variant: "destructive",
      });
    }
  };

  const lockPayrollPeriod = async (periodId: string) => {
    try {
      const { error } = await supabase
        .from('payroll_periods')
        .update({ status: 'locked' })
        .eq('id', periodId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payroll period locked successfully",
      });

      fetchPayrollPeriods();
    } catch (error) {
      console.error('Error locking payroll period:', error);
      toast({
        title: "Error",
        description: "Failed to lock payroll period",
        variant: "destructive",
      });
    }
  };

  const approvePayrollRecord = async (recordId: string, approvedBy: string) => {
    try {
      const { error } = await supabase
        .from('payroll_records')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payroll record approved successfully",
      });

      // Refresh records for current period
      const record = records.find(r => r.id === recordId);
      if (record) {
        fetchPayrollRecords(record.payroll_period_id);
      }
    } catch (error) {
      console.error('Error approving payroll record:', error);
      toast({
        title: "Error",
        description: "Failed to approve payroll record",
        variant: "destructive",
      });
    }
  };

  const calculateContractorPayroll = async (contractorId: string, periodStart: string, periodEnd: string) => {
    try {
      const { data, error } = await supabase.rpc('calculate_contractor_payroll', {
        p_contractor_id: contractorId,
        p_period_start: periodStart,
        p_period_end: periodEnd
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payroll calculated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error calculating payroll:', error);
      toast({
        title: "Error",
        description: "Failed to calculate payroll",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchPayrollPeriods();
  }, []);

  return {
    periods,
    records,
    loading,
    refreshPeriods: fetchPayrollPeriods,
    fetchPayrollRecords,
    createPayrollPeriod,
    lockPayrollPeriod,
    approvePayrollRecord,
    calculateContractorPayroll
  };
}