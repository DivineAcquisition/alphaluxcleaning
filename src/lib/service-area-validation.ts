// Service area validation for AlphaLux Cleaning
// Covers all of Texas and California

function isTexasZip(zipCode: number): boolean {
  // Comprehensive Texas ZIP code ranges covering all major cities and regions
  return (zipCode >= 73301 && zipCode <= 73301) ||  // Austin PO Box
         (zipCode >= 75000 && zipCode <= 75999) ||  // Dallas area
         (zipCode >= 76000 && zipCode <= 76999) ||  // Fort Worth area
         (zipCode >= 77000 && zipCode <= 77999) ||  // Houston area (includes 77521)
         (zipCode >= 78000 && zipCode <= 78999) ||  // San Antonio/Austin area
         (zipCode >= 79000 && zipCode <= 79999) ||  // West Texas (El Paso, Lubbock, etc.)
         (zipCode >= 73000 && zipCode <= 73999) ||  // Central/North Texas
         (zipCode >= 88500 && zipCode <= 88599);    // El Paso extended range
}

function isCaliforniaZip(zipCode: number): boolean {
  // California ZIP code ranges covering entire state
  return (zipCode >= 90000 && zipCode <= 96199);
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

  console.log(`❌ ZIP code ${cleanZip} rejected - outside service area`);
  
  return {
    isValid: false,
    message: `Sorry, we currently service California & Texas only. ZIP code ${cleanZip} is outside our service area.`
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