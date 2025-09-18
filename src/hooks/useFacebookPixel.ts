import { useEffect } from 'react';

// Declare fbq as a global function
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

interface ViewContentParams {
  content_name: string;
  content_type?: string;
  value?: number;
  currency?: string;
}

interface AddToCartParams {
  content_name: string;
  value: number;
  currency?: string;
}

interface InitiateCheckoutParams {
  value: number;
  currency?: string;
}

interface PurchaseParams {
  value: number;
  currency?: string;
  content_type?: string;
  content_name?: string;
  event_id?: string;
}

interface CustomPurchaseParams extends PurchaseParams {
  mrr_est?: number;
  arr_est?: number;
  booking_id?: string;
}

export function useFacebookPixel() {
  useEffect(() => {
    // Ensure fbq is available
    if (typeof window !== 'undefined' && window.fbq) {
      console.log('✅ Facebook Pixel initialized and ready');
    }
  }, []);

  const trackViewContent = (params: ViewContentParams) => {
    if (typeof window !== 'undefined' && window.fbq) {
      console.log('🎯 FB Pixel: ViewContent', params);
      window.fbq('track', 'ViewContent', {
        content_name: params.content_name,
        content_type: params.content_type || 'service',
        ...(params.value && { value: params.value }),
        currency: params.currency || 'USD'
      });
    }
  };

  const trackAddToCart = (params: AddToCartParams) => {
    if (typeof window !== 'undefined' && window.fbq) {
      console.log('🛒 FB Pixel: AddToCart', params);
      window.fbq('track', 'AddToCart', {
        content_name: params.content_name,
        value: params.value,
        currency: params.currency || 'USD'
      });
    }
  };

  const trackInitiateCheckout = (params: InitiateCheckoutParams) => {
    if (typeof window !== 'undefined' && window.fbq) {
      console.log('💳 FB Pixel: InitiateCheckout', params);
      window.fbq('track', 'InitiateCheckout', {
        value: params.value,
        currency: params.currency || 'USD'
      });
    }
  };

  const trackPurchase = (params: PurchaseParams) => {
    if (typeof window !== 'undefined' && window.fbq) {
      console.log('🎉 FB Pixel: Purchase', params);
      window.fbq('track', 'Purchase', {
        value: params.value,
        currency: params.currency || 'USD',
        content_type: params.content_type || 'service',
        content_name: params.content_name,
        ...(params.event_id && { event_id: params.event_id })
      });
    }
  };

  const trackCustomPurchase = (params: CustomPurchaseParams) => {
    if (typeof window !== 'undefined' && window.fbq) {
      console.log('🎉 FB Pixel: PurchaseWithRecurring', params);
      window.fbq('trackCustom', 'PurchaseWithRecurring', {
        value: params.value,
        currency: params.currency || 'USD',
        ...(params.mrr_est && { mrr_est: params.mrr_est }),
        ...(params.arr_est && { arr_est: params.arr_est }),
        ...(params.booking_id && { booking_id: params.booking_id })
      });
    }
  };

  const trackLead = (contentName: string, value?: number) => {
    if (typeof window !== 'undefined' && window.fbq) {
      console.log('🎯 FB Pixel: Lead', { content_name: contentName, value });
      window.fbq('track', 'Lead', {
        content_name: contentName,
        content_category: 'Cleaning Services',
        ...(value && { value })
      });
    }
  };

  const trackCommercialEstimateRequest = (serviceType: string, squareFootage?: number) => {
    if (typeof window !== 'undefined' && window.fbq) {
      console.log('🏢 FB Pixel: CommercialEstimateRequest', { service_type: serviceType, square_footage: squareFootage });
      window.fbq('trackCustom', 'CommercialEstimateRequest', {
        service_type: serviceType,
        square_footage: squareFootage,
        content_category: 'Commercial Cleaning'
      });
    }
  };

  const trackQuoteCalculated = (serviceType: string, price: number, frequency: string) => {
    if (typeof window !== 'undefined' && window.fbq) {
      console.log('📊 FB Pixel: QuoteCalculated', { service_type: serviceType, quote_amount: price, frequency });
      window.fbq('trackCustom', 'QuoteCalculated', {
        service_type: serviceType,
        quote_amount: price,
        frequency: frequency,
        currency: 'USD'
      });
    }
  };

  return {
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
    trackCustomPurchase,
    trackLead,
    trackCommercialEstimateRequest,
    trackQuoteCalculated
  };
}