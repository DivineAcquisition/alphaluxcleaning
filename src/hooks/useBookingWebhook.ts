import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateComprehensivePricing, formatPricingForGHL } from '@/lib/comprehensive-pricing';

interface BookingWebhookData {
  // Service Selection Data
  homeSize?: string;
  serviceType?: string;
  frequency?: string;
  addOns?: string[];
  flooringType?: string;
  
  // Service Details
  serviceDate?: string;
  serviceTime?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contactNumber?: string;
  specialInstructions?: string;
  
  // Property Details
  squareFootage?: number;
  bedrooms?: string;
  bathrooms?: string;
  dwellingType?: string;
  
  // Customer Information
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  // Comprehensive Pricing Information
  basePrice?: number;
  addOnPrices?: { [key: string]: number };
  
  // Detailed Discount Information
  discounts?: {
    global?: { percentage: number; dollarAmount: number; description: string };
    frequency?: { percentage: number; dollarAmount: number; description: string };
    membership?: { percentage: number; dollarAmount: number; description: string };
    referral?: { percentage: number; dollarAmount: number; description: string };
    promo?: { percentage: number; dollarAmount: number; description: string };
  };
  
  // Labor Cost Information
  laborCosts?: {
    tier1Rate: number;
    tier2Rate: number;
    tier3Rate: number;
    estimatedHours: number;
    estimatedLaborCost: number;
  };
  
  // Legacy discount fields (for backwards compatibility)
  frequencyDiscount?: number;
  membershipDiscount?: number;
  referralDiscount?: number;
  promoDiscount?: number;
  promoCode?: string;
  
  totalPrice?: number;
  totalSavings?: number;
  
  // Payment Information
  paymentType?: 'full' | 'half' | 'prepayment';
  paymentAmount?: number;
  
  // Recurring Information (if applicable)
  selectedTier?: string;
  selectedRecurring?: string;
  membership?: boolean;
  
  // Required fields
  bookingStep: 'service_selection' | 'service_details' | 'payment' | 'confirmation';
  webhookUrl?: string; // Now optional since we use configured URLs
  
  // Additional fields for enhanced webhook system
  order_id?: string; // Renamed from orderId for consistency
  booking_id?: string; // Renamed from bookingId for consistency
  session_id?: string; // Renamed from sessionId for consistency
  
  // Backwards compatibility - deprecated but supported
  orderId?: string; // Use order_id instead
  bookingId?: string; // Use booking_id instead
  sessionId?: string; // Use session_id instead
  
  // GHL Formatted Data
  ghlFormattedData?: any;
}

export const useBookingWebhook = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // UUID validation helper
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const sendBookingWebhook = async (data: BookingWebhookData) => {
    const webhookStartTime = Date.now();
    setIsLoading(true);
    
    // Enhanced pre-send validation and logging
    const dataValidation = {
      customer_info_complete: !!(data.customerInfo?.name && data.customerInfo?.email),
      address_complete: !!(data.address?.street && data.address?.city),
      pricing_complete: !!(data.totalPrice && data.totalPrice > 0),
      service_details_complete: !!(data.homeSize && data.frequency),
      has_order_id: !!(data.order_id || data.orderId),
      has_session_id: !!(data.session_id || data.sessionId)
    };
    
    console.log('📤 useBookingWebhook: Enhanced pre-send analysis:', {
      step: data.bookingStep,
      timestamp: new Date().toISOString(),
      payload_size_bytes: JSON.stringify(data).length,
      payload_size_kb: Math.round(JSON.stringify(data).length / 1024 * 100) / 100,
      data_validation: dataValidation,
      key_identifiers: {
        order_id: data.order_id || data.orderId || 'none',
        booking_id: data.booking_id || data.bookingId || 'none', 
        session_id: data.session_id || data.sessionId || 'none'
      }
    });
    
    try {
      // Calculate comprehensive pricing breakdown
      const pricingBreakdown = calculateComprehensivePricing(
        data.basePrice || 0,
        Object.values(data.addOnPrices || {}).reduce((sum, price) => sum + price, 0),
        data.homeSize || '',
        data.frequency || '',
        data.membership || false,
        !!(data.discounts?.referral?.dollarAmount || data.referralDiscount),
        '' // No promo code from current data
      );

      // Format data for GHL
      const ghlFormattedData = formatPricingForGHL(
        pricingBreakdown,
        {
          name: data.customerInfo?.name || '',
          email: data.customerInfo?.email || '',
          phone: data.customerInfo?.phone || data.contactNumber || '',
          address: data.address?.street || data.customerInfo?.address || '',
          city: data.address?.city || data.customerInfo?.city || '',
          state: data.address?.state || data.customerInfo?.state || 'TX',
          zipCode: data.address?.zipCode || data.customerInfo?.zipCode || ''
        },
        {
          serviceType: data.serviceType,
          homeSize: data.homeSize,
          frequency: data.frequency,
          flooringType: data.flooringType,
          addOns: data.addOns,
          serviceDate: data.serviceDate,
          serviceTime: data.serviceTime
        }
      );

      // Normalize ID fields for consistency and add enhanced data
      const normalizedData = {
        ...data,
        order_id: data.order_id || data.orderId,
        booking_id: data.booking_id || data.bookingId,
        session_id: data.session_id || data.sessionId,
        timestamp: new Date().toISOString(),
        source: 'booking_flow',
        
        // Enhanced pricing data
        discounts: {
          global: pricingBreakdown.globalDiscount,
          frequency: pricingBreakdown.frequencyDiscount,
          membership: pricingBreakdown.membershipDiscount,
          referral: pricingBreakdown.referralDiscount,
          promo: pricingBreakdown.promoDiscount
        },
        laborCosts: pricingBreakdown.laborCosts,
        totalSavings: pricingBreakdown.totalSavings,
        
        // GHL formatted data
        ghlFormattedData: ghlFormattedData,
        
        // Service date/time separation and combination
        serviceDateSeparate: data.serviceDate,
        serviceTimeSeparate: data.serviceTime,
        serviceDateTime: data.serviceDate && data.serviceTime 
          ? `${data.serviceDate} ${data.serviceTime}` 
          : undefined
      };

      // Choose webhook function based on order_id validity
      const hasValidOrderId = normalizedData.order_id && isValidUUID(normalizedData.order_id);
      const functionName = hasValidOrderId 
        ? 'enhanced-booking-webhook-v2' 
        : 'send-booking-transaction-to-zapier';

      console.log('🔄 useBookingWebhook: Function selection logic:', {
        step: data.bookingStep,
        function_selected: functionName,
        decision_factors: {
          has_order_id: !!normalizedData.order_id,
          is_valid_uuid: hasValidOrderId,
          order_id_value: normalizedData.order_id || 'none'
        }
      });

      // Comprehensive webhook payload (eliminates duplicates)
      const comprehensivePayload = {
        event_type: "order_entry",
        timestamp: new Date().toISOString(),
        source: "bay_area_cleaning_pros",
        
        // Core service information (ensuring frequency is properly captured)
        serviceType: data.serviceType || 'residential_cleaning',
        homeSize: data.homeSize || '',
        frequency: data.frequency || '', // Ensure frequency is captured
        addOns: data.addOns || [],
        flooringType: data.flooringType || '',
        
        // Service scheduling with separate and unified formats
        serviceDateSeparate: data.serviceDate,
        serviceTimeSeparate: data.serviceTime, 
        serviceDateTime: data.serviceDate && data.serviceTime 
          ? `${data.serviceDate} ${data.serviceTime}` 
          : '',
        specialInstructions: data.specialInstructions || '',
        
        // Customer information
        customerInfo: {
          name: data.customerInfo?.name || '',
          email: data.customerInfo?.email || '',
          phone: data.customerInfo?.phone || data.contactNumber || '',
          address: data.address?.street || data.customerInfo?.address || '',
          city: data.address?.city || data.customerInfo?.city || '',
          state: data.address?.state || data.customerInfo?.state || 'TX',
          zipCode: data.address?.zipCode || data.customerInfo?.zipCode || ''
        },
        
        // Property details
        propertyDetails: {
          squareFootage: data.squareFootage || null,
          bedrooms: data.bedrooms || null,
          bathrooms: data.bathrooms || null,
          dwellingType: data.dwellingType || null,
          flooringType: data.flooringType || ''
        },
        
        // Comprehensive pricing (no duplicates)
        basePrice: pricingBreakdown.basePrice,
        addOnPrices: data.addOnPrices || {},
        discounts: {
          global: pricingBreakdown.globalDiscount,
          frequency: pricingBreakdown.frequencyDiscount,
          membership: pricingBreakdown.membershipDiscount,
          referral: pricingBreakdown.referralDiscount,
          promo: pricingBreakdown.promoDiscount
        },
        
        // Enhanced labor costs for all tiers
        laborCosts: {
          tier1Rate: pricingBreakdown.laborCosts.tier1Rate,
          tier2Rate: pricingBreakdown.laborCosts.tier2Rate,
          tier3Rate: pricingBreakdown.laborCosts.tier3Rate,
          estimatedHours: pricingBreakdown.laborCosts.estimatedHours,
          // Calculate total costs for each tier
          tier1TotalCost: Math.round(pricingBreakdown.laborCosts.tier1Rate * pricingBreakdown.laborCosts.estimatedHours * 100) / 100,
          tier2TotalCost: Math.round(pricingBreakdown.laborCosts.tier2Rate * pricingBreakdown.laborCosts.estimatedHours * 100) / 100,
          tier3TotalCost: Math.round(pricingBreakdown.laborCosts.tier3Rate * pricingBreakdown.laborCosts.estimatedHours * 100) / 100,
          estimatedLaborCost: pricingBreakdown.laborCosts.estimatedLaborCost
        },
        
        // Legacy pricing fields (remove duplicates)
        frequencyDiscount: pricingBreakdown.frequencyDiscount.dollarAmount,
        membershipDiscount: pricingBreakdown.membershipDiscount.dollarAmount,
        promoDiscount: pricingBreakdown.promoDiscount.dollarAmount,
        totalPrice: pricingBreakdown.finalTotal,
        totalSavings: pricingBreakdown.totalSavings,
        
        // Payment information
        paymentType: data.paymentType || 'pay_after_service',
        paymentAmount: data.paymentAmount || 0,
        
        // GHL formatted data
        ghlFormattedData: ghlFormattedData,
        
        // Metadata
        order_data: {
          id: normalizedData.order_id,
          payment_intent_id: normalizedData.order_id,
          status: 'confirmed',
          created_at: normalizedData.timestamp
        },
        customer_data: {
          name: data.customerInfo?.name || '',
          email: data.customerInfo?.email || '',
          phone: data.customerInfo?.phone || data.contactNumber || '',
          street_address: data.address?.street || data.customerInfo?.address || '',
          city: data.address?.city || data.customerInfo?.city || '',
          state: data.address?.state || data.customerInfo?.state || 'TX',
          zip_code: data.address?.zipCode || data.customerInfo?.zipCode || '',
          square_footage: data.squareFootage || null,
          bedrooms: data.bedrooms || null,
          bathrooms: data.bathrooms || null,
          dwelling_type: data.dwellingType || null,
          flooring_type: data.flooringType || ''
        },
        booking_data: {
          booking_id: normalizedData.booking_id,
          booking_step: data.bookingStep,
          is_recurring: !!data.frequency && data.frequency !== '',
          membership_added: !!data.membership,
          promo_code_used: data.promoCode || null,
          user_authenticated: false,
          total_savings: pricingBreakdown.totalSavings
        },
        metadata: {
          order_id: normalizedData.order_id,
          booking_id: normalizedData.booking_id,
          session_id: normalizedData.session_id,
          processed_at: normalizedData.timestamp,
          platform: 'web',
          user_agent: navigator.userAgent,
          webhook_version: '2.0_comprehensive'
        }
      };

      // Enhanced payload preparation based on order ID validity
      const payload = hasValidOrderId ? {
        order_id: normalizedData.order_id,
        booking_id: normalizedData.booking_id,
        comprehensive_data: comprehensivePayload
      } : {
        transactionData: comprehensivePayload,
        type: 'booking_step'
      };

      console.log('📋 useBookingWebhook: Prepared payload info:', {
        function: functionName,
        payload_structure: Object.keys(payload),
        payload_size_kb: Math.round(JSON.stringify(payload).length / 1024 * 100) / 100,
        contains_comprehensive_data: !!(payload as any).comprehensive_data
      });

      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      const webhookTime = Date.now() - webhookStartTime;
      
      if (error) {
        console.error('❌ useBookingWebhook: Webhook invocation failed:', {
          step: data.bookingStep,
          function: functionName,
          error_message: error.message,
          error_details: error.details,
          time_ms: webhookTime,
          payload_info: {
            size_kb: Math.round(JSON.stringify(payload).length / 1024 * 100) / 100,
            has_order_id: hasValidOrderId
          }
        });
        throw error;
      }

      // Enhanced success logging with detailed metrics
      const successMetrics = {
        step: data.bookingStep,
        function_used: functionName,
        response_time_ms: webhookTime,
        result_analysis: {
          success: result?.success,
          message: result?.message,
          webhooks_attempted: result?.results?.length || 0,
          webhooks_successful: result?.results?.filter(r => r.success).length || 0,
          processing_stats: result?.processing_stats
        },
        performance_indicators: {
          fast_response: webhookTime < 2000,
          large_payload: JSON.stringify(payload).length > 50000,
          efficiency_score: Math.round(1000 / webhookTime * 100) / 100
        }
      };

      console.log('✅ useBookingWebhook: Webhook execution completed:', successMetrics);
      
      // Performance warnings
      if (webhookTime > 5000) {
        console.warn('⚠️ useBookingWebhook: Slow webhook detected:', {
          function: functionName,
          step: data.bookingStep,
          time_ms: webhookTime,
          recommendation: 'Consider investigating webhook endpoint performance'
        });
      }
      
      if (result?.results && result.results.some(r => !r.success)) {
        console.warn('⚠️ useBookingWebhook: Partial webhook failures detected:', {
          failed_endpoints: result.results.filter(r => !r.success).map(r => ({
            url: r.webhook_url,
            error: r.error
          }))
        });
      }

      // Step-specific completion logging
      if (data.bookingStep === 'confirmation') {
        console.log('🎉 useBookingWebhook: BOOKING CONFIRMATION completed:', {
          order_id: normalizedData.order_id,
          total_processing_time_ms: webhookTime,
          webhooks_sent: result?.results?.length || 0,
          all_webhooks_successful: result?.results?.every(r => r.success) || false,
          customer_email: data.customerInfo?.email || 'unknown'
        });
        
        toast({
          title: "Booking confirmed",
          description: "Your service has been scheduled successfully.",
        });
      }

      return result;
    } catch (error) {
      const webhookTime = Date.now() - webhookStartTime;
      
      // Enhanced error logging with context
      const errorContext = {
        step: data.bookingStep,
        error_type: error.constructor?.name || 'UnknownError',
        error_message: error.message,
        time_to_failure_ms: webhookTime,
        function_attempted: (data.order_id || data.orderId) && isValidUUID(data.order_id || data.orderId)
          ? 'enhanced-booking-webhook-v2' 
          : 'send-booking-transaction-to-zapier',
        payload_info: {
          size_kb: Math.round(JSON.stringify(data).length / 1024 * 100) / 100,
          validation_results: dataValidation
        },
        recovery_suggestions: [
          'Check webhook endpoint availability',
          'Verify payload structure',
          'Review network connectivity'
        ]
      };
      
      console.error('🚨 useBookingWebhook: Critical webhook failure:', errorContext);
      
      // Graceful error handling for confirmation step
      if (data.bookingStep === 'confirmation') {
        console.log('🛡️ useBookingWebhook: Graceful error handling for confirmation:', {
          order_id: data.order_id || data.orderId,
          fallback_action: 'Show success message despite webhook failure'
        });
        
        toast({
          title: "Booking confirmed",
          description: "Your service has been scheduled (notifications processing).",
          variant: "default"
        });
      }
      
      throw error;
    } finally {
      const totalTime = Date.now() - webhookStartTime;
      console.log('⏱️ useBookingWebhook: Execution completed:', {
        step: data.bookingStep,
        total_execution_time_ms: totalTime,
        loading_state_cleared: true
      });
      
      setIsLoading(false);
    }
  };

  return {
    sendBookingWebhook,
    isLoading
  };
};