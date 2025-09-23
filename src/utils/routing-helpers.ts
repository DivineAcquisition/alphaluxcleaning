import { NavigateFunction } from 'react-router-dom';

/**
 * Standardized navigation helpers to ensure consistent routing patterns
 */

export const navigateToOrderConfirmation = (navigate: NavigateFunction, orderId: string) => {
  // Use URL parameter pattern for consistency
  navigate(`/order-confirmation/${orderId}`, { replace: true });
};

export const navigateToOrderStatus = (navigate: NavigateFunction, orderId?: string, sessionId?: string) => {
  if (orderId) {
    navigate(`/order-status?order_id=${orderId}`);
  } else if (sessionId) {
    navigate(`/order-status?session_id=${sessionId}`);
  } else {
    navigate('/order-status');
  }
};

export const navigateToScheduleService = (navigate: NavigateFunction, orderId?: string, sessionId?: string) => {
  if (orderId) {
    navigate(`/schedule-service?order_id=${orderId}`);
  } else if (sessionId) {
    navigate(`/schedule-service?session_id=${sessionId}`);
  } else {
    navigate('/schedule-service');
  }
};

/**
 * Helper to check if we should use React Router navigation vs window.location
 * Always prefer React Router navigation for better UX
 */
export const shouldUseReactRouterNavigation = () => {
  return typeof window !== 'undefined' && window.history && window.history.pushState;
};