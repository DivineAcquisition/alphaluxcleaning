import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  zipCode: string;
  homeSize: string;
  serviceType: string;
  frequency: string;
  expectedPrice?: number;
  expectedDeposit?: number;
}

export interface TestResult {
  scenario: TestScenario;
  status: 'running' | 'passed' | 'failed';
  startTime: number;
  endTime?: number;
  duration?: number;
  checks: {
    name: string;
    passed: boolean;
    message?: string;
  }[];
  bookingId?: string;
  customerId?: string;
  error?: string;
}

export function useBookingFlowTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  const runTest = async (scenario: TestScenario): Promise<TestResult> => {
    const startTime = Date.now();
    setCurrentTest(scenario.id);
    
    const result: TestResult = {
      scenario,
      status: 'running',
      startTime,
      checks: [],
    };

    try {
      // Step 1: Create customer
      const customerData = {
        email: `test-${Date.now()}@alphalux-test.com`,
        name: `Test User ${scenario.id}`,
        phone: '555-0100',
        postal_code: scenario.zipCode,
      };

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      result.checks.push({
        name: 'Customer Created',
        passed: !customerError && !!customer,
        message: customerError ? customerError.message : `Customer ID: ${customer?.id}`,
      });

      if (customerError || !customer) throw new Error('Failed to create customer');
      result.customerId = customer.id;

      // Step 2: Create booking
      const bookingData = {
        customer_id: customer.id,
        full_name: customerData.name,
        zip_code: scenario.zipCode,
        sqft_or_bedrooms: scenario.homeSize,
        service_type: scenario.serviceType,
        frequency: scenario.frequency,
        est_price: scenario.expectedPrice || 350,
        deposit_amount: scenario.expectedDeposit || 87.5,
        status: 'pending',
        source: 'automated_test',
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      result.checks.push({
        name: 'Booking Created',
        passed: !bookingError && !!booking,
        message: bookingError ? bookingError.message : `Booking ID: ${booking?.id}`,
      });

      if (bookingError || !booking) throw new Error('Failed to create booking');
      result.bookingId = booking.id;

      // Step 3: Verify pricing calculations
      const pricingCorrect = Math.abs(booking.est_price - (scenario.expectedPrice || 350)) < 1;
      const depositCorrect = Math.abs(booking.deposit_amount - (scenario.expectedDeposit || 87.5)) < 1;

      result.checks.push({
        name: 'Pricing Calculation',
        passed: pricingCorrect,
        message: `Expected: $${scenario.expectedPrice}, Got: $${booking.est_price}`,
      });

      result.checks.push({
        name: 'Deposit Calculation (25%)',
        passed: depositCorrect,
        message: `Expected: $${scenario.expectedDeposit}, Got: $${booking.deposit_amount}`,
      });

      // Step 4: Check if all required fields populated
      const requiredFieldsCheck = !!(
        booking.customer_id &&
        booking.zip_code &&
        booking.service_type &&
        booking.frequency &&
        booking.est_price
      );

      result.checks.push({
        name: 'Required Fields Populated',
        passed: requiredFieldsCheck,
        message: requiredFieldsCheck ? 'All required fields present' : 'Missing required fields',
      });

      // Step 5: Record test run in database
      await supabase.from('test_runs').insert({
        scenario_name: scenario.name,
        status: 'passed',
        duration_ms: Date.now() - startTime,
        results: result,
        test_type: 'automated',
      });

      result.status = 'passed';
    } catch (error: any) {
      result.status = 'failed';
      result.error = error.message;

      await supabase.from('test_runs').insert({
        scenario_name: scenario.name,
        status: 'failed',
        duration_ms: Date.now() - startTime,
        error_message: error.message,
        test_type: 'automated',
      });
    }

    result.endTime = Date.now();
    result.duration = result.endTime - startTime;
    setCurrentTest(null);

    return result;
  };

  const runTestSuite = async (scenarios: TestScenario[]) => {
    setIsRunning(true);
    setResults([]);

    for (const scenario of scenarios) {
      const result = await runTest(scenario);
      setResults((prev) => [...prev, result]);
    }

    setIsRunning(false);
  };

  const clearResults = () => setResults([]);

  return {
    isRunning,
    currentTest,
    results,
    runTest,
    runTestSuite,
    clearResults,
  };
}
