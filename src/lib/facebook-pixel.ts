// Facebook Pixel tracking utilities
declare global {
  interface Window {
    fbq: any;
  }
}

export const trackEvent = (eventName: string, parameters?: any) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
  }
};

export const trackCustomEvent = (eventName: string, parameters?: any) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, parameters);
  }
};

// Predefined tracking functions for common events
export const trackPurchase = (value: number, currency: string = 'USD', serviceType?: string) => {
  trackEvent('Purchase', {
    value: value,
    currency: currency,
    content_name: serviceType || 'Cleaning Service',
    content_category: 'Cleaning Services'
  });
};

export const trackLead = (serviceType?: string, value?: number) => {
  trackEvent('Lead', {
    content_name: serviceType || 'Cleaning Service',
    content_category: 'Cleaning Services',
    value: value
  });
};

export const trackInitiateCheckout = (value?: number, serviceType?: string) => {
  trackEvent('InitiateCheckout', {
    value: value,
    currency: 'USD',
    content_name: serviceType || 'Cleaning Service',
    content_category: 'Cleaning Services'
  });
};

export const trackViewContent = (contentName: string, value?: number) => {
  trackEvent('ViewContent', {
    content_name: contentName,
    content_category: 'Cleaning Services',
    value: value
  });
};

export const trackCompleteRegistration = (serviceType?: string) => {
  trackEvent('CompleteRegistration', {
    content_name: serviceType || 'Cleaning Service',
    content_category: 'Cleaning Services'
  });
};

// Custom events specific to cleaning business
export const trackBookingStarted = (serviceType: string, squareFootage?: number) => {
  trackCustomEvent('BookingStarted', {
    service_type: serviceType,
    square_footage: squareFootage,
    content_category: 'Cleaning Services'
  });
};

export const trackQuoteCalculated = (serviceType: string, price: number, frequency: string) => {
  trackCustomEvent('QuoteCalculated', {
    service_type: serviceType,
    quote_amount: price,
    frequency: frequency,
    currency: 'USD'
  });
};

export const trackCommercialEstimateRequest = (serviceType: string, squareFootage?: number) => {
  trackCustomEvent('CommercialEstimateRequest', {
    service_type: serviceType,
    square_footage: squareFootage,
    content_category: 'Commercial Cleaning'
  });
};