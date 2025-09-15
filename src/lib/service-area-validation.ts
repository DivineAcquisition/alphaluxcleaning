// Service area validation for AlphaLux Cleaning
// Covers all of Texas and California

function isTexasZip(zipCode: number): boolean {
  return zipCode === 73301 || // Austin PO Box
         (zipCode >= 75001 && zipCode <= 79999) || // Main Texas range
         (zipCode >= 88510 && zipCode <= 88595); // El Paso area
}

function isCaliforniaZip(zipCode: number): boolean {
  return zipCode >= 90001 && zipCode <= 96162;
}

export interface ServiceAreaValidation {
  isValid: boolean;
  message?: string;
}

export function validateServiceAreaZipCode(zipCode: string): ServiceAreaValidation {
  if (!zipCode || zipCode.trim() === '') {
    return {
      isValid: false,
      message: 'ZIP code is required'
    };
  }

  // Clean the zip code (remove any non-numeric characters)
  const cleanZip = zipCode.replace(/[^\d]/g, '');
  
  if (!/^\d{5}$/.test(cleanZip)) {
    return {
      isValid: false,
      message: 'Please enter a valid 5-digit ZIP code'
    };
  }

  const zipNumber = parseInt(cleanZip, 10);
  
  if (isTexasZip(zipNumber) || isCaliforniaZip(zipNumber)) {
    return {
      isValid: true
    };
  }

  return {
    isValid: false,
    message: `Sorry, we currently service Cali & Texas only. ${cleanZip} is outside our service area.`
  };
}

export function getNearestServiceableZipCodes(zipCode: string): string[] {
  // For Texas and California, suggest popular ZIP codes in major cities
  const zip = parseInt(zipCode);
  
  if (isTexasZip(zip)) {
    return ['75001', '77001', '78701']; // Dallas, Houston, Austin
  } else if (isCaliforniaZip(zip)) {
    return ['90210', '94102', '92101']; // LA, SF, San Diego
  }
  
  return ['75001', '90210']; // Default suggestions
}

export const SERVICE_AREA_INFO = {
  centerCity: 'Cali & Texas',
  radiusMiles: 0,
  contactPhone: '(281) 809-9901',
  contactEmail: 'support@alphaluxclean.com'
};