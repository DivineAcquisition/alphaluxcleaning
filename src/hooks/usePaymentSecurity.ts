import { useState, useEffect, useCallback } from 'react';

interface DeviceFingerprint {
  userAgent: string;
  screen: string;
  timezone: string;
  language: string;
  platform: string;
  webgl: string;
  canvas: string;
}

interface SecurityFeatures {
  isWebAuthnSupported: boolean;
  isApplePaySupported: boolean;
  isGooglePaySupported: boolean;
  isTouchDevice: boolean;
  hasSecureContext: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

interface FraudIndicators {
  riskScore: number;
  indicators: string[];
  recommendations: string[];
}

export function usePaymentSecurity() {
  const [securityFeatures, setSecurityFeatures] = useState<SecurityFeatures>({
    isWebAuthnSupported: false,
    isApplePaySupported: false,
    isGooglePaySupported: false,
    isTouchDevice: false,
    hasSecureContext: false,
    deviceType: 'desktop'
  });

  const [deviceFingerprint, setDeviceFingerprint] = useState<DeviceFingerprint | null>(null);
  const [fraudIndicators, setFraudIndicators] = useState<FraudIndicators>({
    riskScore: 0,
    indicators: [],
    recommendations: []
  });

  // Generate device fingerprint for fraud detection
  const generateDeviceFingerprint = useCallback((): DeviceFingerprint => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('BayAreaCleaning', 10, 10);
    const canvasFingerprint = canvas.toDataURL();

    const webglCanvas = document.createElement('canvas');
    const webglCtx = webglCanvas.getContext('webgl');
    const webglFingerprint = webglCtx ? 
      webglCtx.getParameter(webglCtx.VERSION) + webglCtx.getParameter(webglCtx.VENDOR) : 
      'not-supported';

    return {
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      webgl: webglFingerprint,
      canvas: canvasFingerprint.slice(-50) // Last 50 chars for privacy
    };
  }, []);

  // Detect device capabilities and security features
  useEffect(() => {
    const detectSecurityFeatures = async () => {
      const features: SecurityFeatures = {
        isWebAuthnSupported: !!window.PublicKeyCredential,
        isApplePaySupported: false,
        isGooglePaySupported: false,
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        hasSecureContext: window.isSecureContext,
        deviceType: 'desktop'
      };

      // Detect device type
      const userAgent = navigator.userAgent;
      if (/iPad|iPhone|iPod/.test(userAgent)) {
        features.deviceType = /iPad/.test(userAgent) ? 'tablet' : 'mobile';
      } else if (/Android/.test(userAgent)) {
        features.deviceType = /Mobile/.test(userAgent) ? 'mobile' : 'tablet';
      } else if (features.isTouchDevice) {
        features.deviceType = 'tablet';
      }

      // Check Apple Pay support
      if ((window as any).ApplePaySession && (window as any).ApplePaySession.canMakePayments) {
        try {
          features.isApplePaySupported = await (window as any).ApplePaySession.canMakePayments();
        } catch {
          features.isApplePaySupported = false;
        }
      }

      // Check Google Pay support (basic check)
      if ((window as any).google?.payments?.api?.PaymentsClient) {
        features.isGooglePaySupported = true;
      }

      setSecurityFeatures(features);
    };

    detectSecurityFeatures();
    setDeviceFingerprint(generateDeviceFingerprint());
  }, [generateDeviceFingerprint]);

  // Analyze fraud risk
  const analyzeFraudRisk = useCallback((paymentData?: any) => {
    const indicators: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Check secure context
    if (!securityFeatures.hasSecureContext) {
      riskScore += 30;
      indicators.push('Insecure connection detected');
      recommendations.push('Use HTTPS for secure payment processing');
    }

    // Check for suspicious user agent patterns
    const userAgent = navigator.userAgent;
    if (userAgent.length < 50 || userAgent.includes('bot') || userAgent.includes('crawler')) {
      riskScore += 20;
      indicators.push('Suspicious user agent detected');
      recommendations.push('Verify human interaction');
    }

    // Check timezone consistency
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneOffset = new Date().getTimezoneOffset();
    if (Math.abs(timezoneOffset) > 840) { // More than 14 hours offset
      riskScore += 10;
      indicators.push('Unusual timezone detected');
    }

    // Check for WebRTC leaks (VPN detection)
    if (!window.RTCPeerConnection) {
      riskScore += 15;
      indicators.push('WebRTC not available');
      recommendations.push('Enable WebRTC for enhanced security');
    }

    // Check device consistency
    if (securityFeatures.deviceType === 'mobile' && !securityFeatures.isTouchDevice) {
      riskScore += 10;
      indicators.push('Device type inconsistency');
    }

    // Lower risk for modern security features
    if (securityFeatures.isWebAuthnSupported) {
      riskScore -= 5;
    }
    if (securityFeatures.isApplePaySupported || securityFeatures.isGooglePaySupported) {
      riskScore -= 10;
    }

    riskScore = Math.max(0, Math.min(100, riskScore));

    setFraudIndicators({
      riskScore,
      indicators,
      recommendations
    });

    return { riskScore, indicators, recommendations };
  }, [securityFeatures]);

  // Enhanced payment method validation
  const validatePaymentMethod = useCallback(async (paymentMethodData: any) => {
    const validationResults = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      securityScore: 100
    };

    // Validate card number format
    if (paymentMethodData.card) {
      const { number, cvc, exp_month, exp_year } = paymentMethodData.card;
      
      // Basic Luhn algorithm check
      if (number && !luhnCheck(number.replace(/\s/g, ''))) {
        validationResults.isValid = false;
        validationResults.errors.push('Invalid card number');
        validationResults.securityScore -= 50;
      }

      // CVV validation
      if (cvc && (cvc.length < 3 || cvc.length > 4)) {
        validationResults.isValid = false;
        validationResults.errors.push('Invalid CVV');
        validationResults.securityScore -= 30;
      }

      // Expiry validation
      const currentDate = new Date();
      const expiryDate = new Date(exp_year, exp_month - 1);
      if (expiryDate <= currentDate) {
        validationResults.isValid = false;
        validationResults.errors.push('Card has expired');
        validationResults.securityScore -= 40;
      }
    }

    return validationResults;
  }, []);

  // Luhn algorithm for card validation
  const luhnCheck = (cardNumber: string): boolean => {
    let sum = 0;
    let alternate = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let n = parseInt(cardNumber.charAt(i), 10);
      
      if (alternate) {
        n *= 2;
        if (n > 9) {
          n = (n % 10) + 1;
        }
      }
      
      sum += n;
      alternate = !alternate;
    }
    
    return (sum % 10) === 0;
  };

  return {
    securityFeatures,
    deviceFingerprint,
    fraudIndicators,
    analyzeFraudRisk,
    validatePaymentMethod,
    generateDeviceFingerprint
  };
}