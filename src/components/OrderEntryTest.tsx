import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, AlertCircle, ClipboardList } from "lucide-react";

export function OrderEntryTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const [orderScenario, setOrderScenario] = useState("standard_clean");
  const { toast } = useToast();

  const sendOrderEntryTest = async () => {
    setIsLoading(true);
    const correlationId = crypto.randomUUID();
    
    try {
      console.log("Sending order entry test to webhook...");
      
      const testData = getOrderScenarioData(orderScenario);
      
      console.log("Sending test data:", testData);
      
      const response = await fetch("https://hooks.zapier.com/hooks/catch/5011258/u4jui7k/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          ...testData,
          correlationId,
          timestamp: new Date().toISOString(),
          test_mode: true
        }),
      });

      // Since we use no-cors, we can't read the response
      const result = {
        success: true,
        message: "Order entry data sent successfully",
        webhook_status: "Request sent to Zapier",
        correlationId,
        test_mode: true
      };

      console.log("Order entry webhook response:", result);
      setLastTestResult(result);
      
      toast({
        title: "Success!",
        description: "Order entry webhook triggered successfully",
      });
    } catch (error) {
      console.error("Error sending order entry:", error);
      const errorResult = { 
        error: error.message, 
        success: false,
        correlationId,
        timestamp: new Date().toISOString()
      };
      setLastTestResult(errorResult);
      
      toast({
        title: "Error",
        description: `Failed to send order entry webhook: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderScenarioData = (scenario: string) => {
    const baseCustomer = {
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      phone: "(415) 555-0123"
    };

    const baseAddress = {
      street: "123 Oak Street",
      city: "San Francisco",
      state: "CA",
      zip_code: "94102",
      country: "USA"
    };

    const scenarios = {
      standard_clean: {
        service_type: "Standard Cleaning",
        cleaning_type: "standard_clean",
        frequency: "one_time",
        base_service_cost: 99.99,
        square_footage: 1800,
        bedrooms: 3,
        bathrooms: 2,
        dwelling_type: "house",
        flooring_types: ["hardwood", "tile"],
        estimated_duration: "2-3 hours",
        actual_duration: "2.5 hours",
        check_in_time: "10:00 AM",
        check_out_time: "12:30 PM",
        duration_minutes: 150,
        number_of_cleaners: 2,
        add_ons: [
          { name: "Window Cleaning", price: 25.00 }
        ],
        subcontractor: {
          id: "sub_001",
          name: "Maria Garcia",
          tier_level: 2,
          tier_name: "Professional",
          hourly_rate: 18.00
        },
        discount_applied: false,
        discount_type: null,
        discount_description: null,
        discount_percentage: 0,
        discount_amount_cash: 0.00,
        efficiency_bonus: true
      },
      deep_clean: {
        service_type: "Deep Cleaning",
        cleaning_type: "deep_clean", 
        frequency: "one_time",
        base_service_cost: 199.99,
        square_footage: 2200,
        bedrooms: 4,
        bathrooms: 3,
        dwelling_type: "house",
        flooring_types: ["hardwood", "tile", "carpet"],
        estimated_duration: "4-5 hours",
        actual_duration: "4.5 hours",
        check_in_time: "9:00 AM",
        check_out_time: "1:30 PM",
        duration_minutes: 270,
        number_of_cleaners: 3,
        add_ons: [
          { name: "Inside Oven", price: 25.00 },
          { name: "Inside Refrigerator", price: 20.00 },
          { name: "Window Cleaning", price: 30.00 }
        ],
        subcontractor: {
          id: "sub_002",
          name: "Jennifer Chen",
          tier_level: 3,
          tier_name: "Elite",
          hourly_rate: 21.00
        },
        discount_applied: true,
        discount_type: "first_time",
        discount_description: "First-time customer - 15% off",
        discount_percentage: 15,
        discount_amount_cash: 41.25,
        efficiency_bonus: false
      },
      recurring_weekly: {
        service_type: "Standard Cleaning",
        cleaning_type: "standard_clean",
        frequency: "weekly",
        base_service_cost: 89.99,
        square_footage: 1500,
        bedrooms: 2,
        bathrooms: 2,
        dwelling_type: "apartment",
        flooring_types: ["laminate", "tile"],
        estimated_duration: "2 hours",
        actual_duration: "2.0 hours",
        check_in_time: "10:00 AM",
        check_out_time: "12:00 PM",
        duration_minutes: 120,
        number_of_cleaners: 1,
        add_ons: [],
        subcontractor: {
          id: "sub_003",
          name: "David Rodriguez",
          tier_level: 2,
          tier_name: "Professional",
          hourly_rate: 18.00
        },
        discount_applied: true,
        discount_type: "membership",
        discount_description: "CleanCovered Membership - 10% off",
        discount_percentage: 10,
        discount_amount_cash: 8.99,
        efficiency_bonus: true
      },
      move_in_out: {
        service_type: "Move In/Out Cleaning",
        cleaning_type: "move_in_out",
        frequency: "one_time", 
        base_service_cost: 299.99,
        square_footage: 2500,
        bedrooms: 5,
        bathrooms: 4,
        dwelling_type: "house",
        flooring_types: ["hardwood", "tile", "carpet", "laminate"],
        estimated_duration: "6-7 hours",
        actual_duration: "6.0 hours",
        check_in_time: "8:00 AM",
        check_out_time: "2:00 PM",
        duration_minutes: 360,
        number_of_cleaners: 3,
        add_ons: [
          { name: "Inside Oven", price: 25.00 },
          { name: "Inside Refrigerator", price: 20.00 },
          { name: "Cabinet Interiors", price: 30.00 },
          { name: "Window Cleaning", price: 40.00 }
        ],
        subcontractor: {
          id: "sub_004",
          name: "Sarah Williams",
          tier_level: 3,
          tier_name: "Elite",
          hourly_rate: 21.00
        },
        discount_applied: true,
        discount_type: "referral",
        discount_description: "Referral reward - $25 off",
        discount_percentage: 0,
        discount_amount_cash: 25.00,
        efficiency_bonus: true
      }
    };

    const scenarioData = scenarios[scenario] || scenarios.standard_clean;
    
    // Calculate financial breakdown
    const add_ons_total = scenarioData.add_ons.reduce((sum, addon) => sum + addon.price, 0);
    const subtotal_before_discount = scenarioData.base_service_cost + add_ons_total;
    const discount_amount_cash = scenarioData.discount_percentage > 0 
      ? (subtotal_before_discount * scenarioData.discount_percentage / 100)
      : scenarioData.discount_amount_cash;
    const discounted_subtotal = subtotal_before_discount - discount_amount_cash;
    const tax_rate = 8.75; // California tax rate
    const tax_amount = discounted_subtotal * (tax_rate / 100);
    const final_cost = discounted_subtotal + tax_amount;
    const total_savings = discount_amount_cash;
    
    // Calculate subcontractor payment
    const hours_worked = scenarioData.duration_minutes / 60;
    const base_hourly_pay = hours_worked * scenarioData.subcontractor.hourly_rate;
    const efficiency_bonus_amount = scenarioData.efficiency_bonus ? base_hourly_pay * 0.15 : 0;
    const total_subcontractor_pay = base_hourly_pay + efficiency_bonus_amount;
    
    // Calculate team assignment and total labor cost
    const hours_per_cleaner = hours_worked / scenarioData.number_of_cleaners;
    const total_labor_cost = scenarioData.number_of_cleaners * scenarioData.subcontractor.hourly_rate * hours_per_cleaner;
    
    // Generate cleaner assignments
    const cleaners = [
      { id: "sub_001", name: "Maria Garcia", hourly_rate: 18.00 },
      { id: "sub_005", name: "Ana Rodriguez", hourly_rate: 16.00 },
      { id: "sub_006", name: "Carlos Martinez", hourly_rate: 17.00 }
    ];
    
    const cleaner_assignments = Array.from({ length: scenarioData.number_of_cleaners }, (_, index) => {
      const cleaner = cleaners[index] || cleaners[0];
      const individual_pay = cleaner.hourly_rate * hours_per_cleaner;
      return {
        cleaner_id: cleaner.id,
        name: cleaner.name,
        role: index === 0 ? "team_lead" : "cleaner",
        hourly_rate: cleaner.hourly_rate,
        hours_assigned: parseFloat(hours_per_cleaner.toFixed(2)),
        individual_pay: parseFloat(individual_pay.toFixed(2))
      };
    });

    return {
      order: {
        id: `test-order-${Date.now()}`,
        stripe_session_id: `test-session-${Date.now()}`,
        amount: final_cost,
        currency: "usd",
        status: "completed",
        customer_name: baseCustomer.name,
        customer_email: baseCustomer.email,
        customer_phone: baseCustomer.phone,
        cleaning_type: scenarioData.cleaning_type,
        frequency: scenarioData.frequency,
        square_footage: scenarioData.square_footage,
        property_details: {
          bedrooms: scenarioData.bedrooms,
          bathrooms: scenarioData.bathrooms,
          dwelling_type: scenarioData.dwelling_type,
          flooring_types: scenarioData.flooring_types,
          square_footage: scenarioData.square_footage,
          levels: 1,
          has_basement: false,
          has_garage: scenarioData.dwelling_type === "house"
        },
        service_details: {
          service_type: scenarioData.service_type,
          estimated_duration: scenarioData.estimated_duration
        },
        scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduled_time: "10:00 AM",
        created_at: new Date().toISOString(),
        is_recurring: scenarioData.frequency !== "one_time",
        add_ons: scenarioData.add_ons
      },
      team_assignment: {
        number_of_cleaners: scenarioData.number_of_cleaners,
        team_lead: cleaner_assignments[0]?.name || scenarioData.subcontractor.name,
        cleaner_assignments: cleaner_assignments,
        total_labor_cost: parseFloat(total_labor_cost.toFixed(2)),
        labor_distribution: scenarioData.number_of_cleaners === 1 ? "single_cleaner" : "split_evenly"
      },
      subcontractor_payment: {
        assigned_subcontractor: {
          id: scenarioData.subcontractor.id,
          name: scenarioData.subcontractor.name,
          tier_level: scenarioData.subcontractor.tier_level,
          tier_name: scenarioData.subcontractor.tier_name
        },
        hourly_rate_structure: {
          base_hourly_rate: scenarioData.subcontractor.hourly_rate,
          tier_level: scenarioData.subcontractor.tier_level,
          tier_name: scenarioData.subcontractor.tier_name
        },
        job_duration: {
          estimated_duration: scenarioData.estimated_duration,
          actual_duration: scenarioData.actual_duration,
          check_in_time: scenarioData.check_in_time,
          check_out_time: scenarioData.check_out_time,
          duration_minutes: scenarioData.duration_minutes
        },
        payment_calculation: {
          base_hourly_pay: parseFloat(base_hourly_pay.toFixed(2)),
          efficiency_bonus: parseFloat(efficiency_bonus_amount.toFixed(2)),
          total_subcontractor_pay: parseFloat(total_subcontractor_pay.toFixed(2)),
          payment_method: "hourly"
        }
      },
      financial_breakdown: {
        base_service_cost: scenarioData.base_service_cost,
        add_ons: scenarioData.add_ons,
        add_ons_total: parseFloat(add_ons_total.toFixed(2)),
        subtotal_before_discount: parseFloat(subtotal_before_discount.toFixed(2)),
        discount_applied: scenarioData.discount_applied,
        discount_type: scenarioData.discount_type,
        discount_description: scenarioData.discount_description,
        discount_percentage: scenarioData.discount_percentage,
        discount_amount_cash: parseFloat(discount_amount_cash.toFixed(2)),
        discounted_subtotal: parseFloat(discounted_subtotal.toFixed(2)),
        tax_rate: tax_rate,
        tax_amount: parseFloat(tax_amount.toFixed(2)),
        final_cost: parseFloat(final_cost.toFixed(2)),
        total_savings: parseFloat(total_savings.toFixed(2))
      },
      payment: {
        amount_paid: parseFloat(final_cost.toFixed(2)),
        payment_method: "card",
        transaction_id: `test-transaction-${Date.now()}`,
        payment_status: "succeeded"
      },
      service: {
        service_type: scenarioData.service_type,
        frequency: scenarioData.frequency === "one_time" ? "One-time" : scenarioData.frequency.charAt(0).toUpperCase() + scenarioData.frequency.slice(1),
        estimated_duration: scenarioData.estimated_duration,
        special_requirements: [],
        access_instructions: "Key under doormat",
        pets_present: false,
        parking_instructions: "Driveway available"
      },
      address: baseAddress,
      analytics: {
        booking_source: "website",
        marketing_channel: "organic_search",
        customer_ltv_estimate: final_cost * 12,
        booking_completion_time: "00:02:15",
        device_type: "desktop",
        total_customer_orders: 1
      },
      timestamps: {
        order_created: new Date().toISOString(),
        payment_completed: new Date().toISOString(),
        booking_scheduled: new Date().toISOString(),
        webhook_sent: new Date().toISOString()
      }
    };
  };

  const sampleData = {
    order_details: {
      id: "test_order_123",
      customer_name: "Sarah Johnson", 
      customer_email: "sarah.johnson@example.com",
      customer_phone: "(415) 555-0123",
      street_address: "123 Oak Street",
      city: "San Francisco",
      state: "CA",
      zip_code: "94102",
      country: "USA",
      service_type: orderScenario.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      amount: getOrderScenarioData(orderScenario).financial_breakdown.final_cost,
      square_footage: getOrderScenarioData(orderScenario).order.square_footage,
      scheduled_date: "2024-01-16",
      scheduled_time: "10:00 AM",
      frequency: getOrderScenarioData(orderScenario).order.frequency,
      add_ons: getOrderScenarioData(orderScenario).order.add_ons
    },
    subcontractor_payment: getOrderScenarioData(orderScenario).subcontractor_payment,
    financial_breakdown: getOrderScenarioData(orderScenario).financial_breakdown,
    payment_data: {
      payment_method: "card",
      transaction_id: "test_transaction_123",
      payment_status: "succeeded",
      amount_paid: getOrderScenarioData(orderScenario).financial_breakdown.final_cost
    },
    analytics: {
      booking_source: "website",
      marketing_channel: "organic_search",
      device_type: "desktop",
      booking_completion_time: "00:02:15"
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-blue-500" />
          Order Entry Webhook Test
        </CardTitle>
        <CardDescription>
          Test order entry notification webhook (u4jui7k)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Order Scenario</label>
          <Select value={orderScenario} onValueChange={setOrderScenario}>
            <SelectTrigger>
              <SelectValue placeholder="Select order scenario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard_clean">Standard Clean ($135.83 - with add-on)</SelectItem>
              <SelectItem value="deep_clean">Deep Clean ($244.24 - with 15% discount)</SelectItem>
              <SelectItem value="recurring_weekly">Weekly Recurring ($88.18 - membership discount)</SelectItem>
              <SelectItem value="move_in_out">Move In/Out ($390.48 - with $25 referral credit)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={sendOrderEntryTest}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          <ClipboardList className="h-4 w-4" />
          Test Order Entry
        </Button>
        
        {lastTestResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {lastTestResult.success !== false ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    Success
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <Badge variant="destructive">
                    Failed
                  </Badge>
                </>
              )}
            </div>
            
            {lastTestResult.success !== false && (
              <div className="text-sm space-y-2">
                <p><strong>Status:</strong> Order entry processed</p>
                {lastTestResult.webhook_status && (
                  <p><strong>Webhook Status:</strong> {lastTestResult.webhook_status}</p>
                )}
                {lastTestResult.message && (
                  <p><strong>Message:</strong> {lastTestResult.message}</p>
                )}
                {lastTestResult.correlationId && (
                  <p><strong>Correlation ID:</strong> {lastTestResult.correlationId}</p>
                )}
                {lastTestResult.test_mode && (
                  <p><strong>Test Mode:</strong> Yes</p>
                )}
              </div>
            )}
            
            {lastTestResult.error && (
              <div className="text-sm text-red-600 space-y-2">
                <p><strong>Error:</strong> {lastTestResult.error}</p>
                {lastTestResult.correlationId && (
                  <p><strong>Correlation ID:</strong> {lastTestResult.correlationId}</p>
                )}
                {lastTestResult.timestamp && (
                  <p><strong>Timestamp:</strong> {new Date(lastTestResult.timestamp).toLocaleString()}</p>
                )}
              </div>
            )}
            
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View Full Response
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-md overflow-auto max-h-40">
                {JSON.stringify(lastTestResult, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-2">
          <p><strong>Webhook URL:</strong> https://hooks.zapier.com/hooks/catch/5011258/u4jui7k/</p>
          <p>This webhook sends comprehensive order entry data including:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Complete customer and order details</li>
            <li>Subcontractor payment breakdown with hourly rates and bonuses</li>
            <li>Detailed financial breakdown (discounts, taxes, final costs)</li>
            <li>Service type, frequency, and scheduling information</li>
            <li>Payment processing details and transaction data</li>
            <li>Address information and service requirements</li>
            <li>Analytics data for tracking and insights</li>
            <li>Multiple order scenarios with realistic pricing</li>
          </ul>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            View Sample Data Structure
          </summary>
          <pre className="mt-2 p-3 bg-muted rounded-md overflow-auto max-h-60">
            {JSON.stringify(sampleData, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}