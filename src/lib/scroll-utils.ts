/**
 * Utility functions for consistent scrolling and focus management across the app
 */

export interface ScrollOptions {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
  offset?: number;
}

/**
 * Smoothly scroll to a specific element by selector or ref
 */
export const scrollToElement = (
  target: string | HTMLElement,
  options: ScrollOptions = {}
): Promise<void> => {
  return new Promise((resolve) => {
    const element = typeof target === 'string' 
      ? document.querySelector(target) as HTMLElement
      : target;
    
    if (!element) {
      console.warn('scrollToElement: Element not found');
      resolve();
      return;
    }

    const {
      behavior = 'smooth',
      block = 'start',
      inline = 'nearest',
      offset = 0
    } = options;

    // Apply offset if specified
    if (offset !== 0) {
      const elementRect = element.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const targetY = absoluteElementTop + offset;
      
      window.scrollTo({
        top: targetY,
        behavior
      });
    } else {
      element.scrollIntoView({
        behavior,
        block,
        inline
      });
    }

    // Wait for scroll animation to complete
    setTimeout(() => resolve(), behavior === 'smooth' ? 800 : 100);
  });
};

/**
 * Scroll to the top of the page
 */
export const scrollToTop = (options: { behavior?: ScrollBehavior } = {}): Promise<void> => {
  return new Promise((resolve) => {
    const { behavior = 'smooth' } = options;
    
    window.scrollTo({
      top: 0,
      behavior
    });

    setTimeout(() => resolve(), behavior === 'smooth' ? 600 : 100);
  });
};

/**
 * Focus on main content area with accessibility considerations
 */
export const focusOnContent = (selector: string = 'main, [role="main"], .main-content'): void => {
  const mainContent = document.querySelector(selector) as HTMLElement;
  
  if (mainContent) {
    // Make element focusable if it isn't already
    if (!mainContent.hasAttribute('tabindex')) {
      mainContent.setAttribute('tabindex', '-1');
    }
    
    // Focus with smooth scroll
    mainContent.focus({ preventScroll: false });
    
    // Remove tabindex after focus for proper semantics
    setTimeout(() => {
      if (mainContent.getAttribute('tabindex') === '-1') {
        mainContent.removeAttribute('tabindex');
      }
    }, 1000);
  }
};

/**
 * Auto-scroll to payment form section
 */
export const scrollToPaymentForm = async (delay: number = 300): Promise<void> => {
  // Wait for component to render
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const paymentSelectors = [
    '[role="main"]', 
    '.payment-form',
    '[data-testid="payment-form"]',
    'form[data-payment]',
    'main'
  ];
  
  for (const selector of paymentSelectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      await scrollToElement(element, { 
        behavior: 'smooth', 
        block: 'start',
        offset: -20 
      });
      return;
    }
  }
  
  // Fallback to scrolling to top
  await scrollToTop();
};

/**
 * Auto-scroll to order confirmation section
 */
export const scrollToConfirmation = async (delay: number = 200): Promise<void> => {
  // Wait for content to load
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const confirmationSelectors = [
    '.confirmation-hero',
    '[data-testid="booking-confirmed"]',
    'h1:contains("Booking Confirmed")',
    '[role="main"]',
    '.container'
  ];
  
  for (const selector of confirmationSelectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      await scrollToElement(element, { 
        behavior: 'smooth', 
        block: 'center',
        offset: -50 
      });
      return;
    }
  }
  
  // Fallback to scrolling to top
  await scrollToTop();
};

/**
 * Enhanced scroll for step transitions
 */
export const scrollToStepContent = async (
  containerRef: React.RefObject<HTMLElement>,
  delay: number = 150
): Promise<void> => {
  // Wait for step content to render
  await new Promise(resolve => setTimeout(resolve, delay));
  
  if (containerRef.current) {
    await scrollToElement(containerRef.current, {
      behavior: 'smooth',
      block: 'start',
      offset: -10
    });
  } else {
    // Fallback to main content or top
    const mainContent = document.querySelector('main, [role="main"], .main-content') as HTMLElement;
    if (mainContent) {
      await scrollToElement(mainContent, { block: 'start' });
    } else {
      await scrollToTop();
    }
  }
};