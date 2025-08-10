import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key for test mode
const stripePublishableKey = 'pk_test_51QPW5FDN8hM6Ej1bOaUNNafIjV0eTK3EgjXi7J1RA9z4LsOQ3HlHwLtD0JkFMf6wRQv2fA73qCgIQVjJJ3l4WZdF00DkHVLTVN';

export const stripePromise = loadStripe(stripePublishableKey);