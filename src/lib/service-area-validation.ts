// Service area validation for AlphaLux Cleaning
// AlphaLux Cleaning currently services New York State only
// (NYC, Long Island, Westchester, Hudson Valley, Capital Region,
// Central NY, and Western NY).

const NEW_YORK_ZIP_RANGES = [
  { min: 10001, max: 10299 }, // Manhattan
  { min: 10301, max: 10314 }, // Staten Island
  { min: 10451, max: 10475 }, // Bronx
  { min: 10501, max: 10598 }, // Westchester (northern)
  { min: 10601, max: 10710 }, // White Plains / Yonkers
  { min: 10801, max: 10805 }, // New Rochelle
  { min: 10901, max: 10998 }, // Rockland / Orange County
  { min: 11001, max: 11697 }, // Queens / Brooklyn
  { min: 11701, max: 11980 }, // Long Island (Nassau / Suffolk)
  { min: 12000, max: 12999 }, // Albany / Hudson Valley / Capital Region
  { min: 13000, max: 13999 }, // Central / Northern NY (Syracuse, Utica)
  { min: 14000, max: 14999 }, // Western NY (Buffalo, Rochester)
];

function isNewYorkZip(zipCode: number): boolean {
  return NEW_YORK_ZIP_RANGES.some(
    (range) => zipCode >= range.min && zipCode <= range.max,
  );
}

export interface ServiceAreaValidation {
  isValid: boolean;
  message?: string;
}

export function validateServiceAreaZipCode(
  zipCode: string,
  selectedState?: string,
): ServiceAreaValidation {
  if (!zipCode || zipCode.trim() === '') {
    return { isValid: false, message: 'ZIP code is required' };
  }

  const cleanZip = zipCode.replace(/[^\d]/g, '');

  if (!/^\d{5}$/.test(cleanZip)) {
    return {
      isValid: false,
      message: 'Please enter a valid 5-digit ZIP code',
    };
  }

  const zipNumber = parseInt(cleanZip, 10);

  // If the caller pinned a state, only accept NY.
  if (selectedState) {
    const normalizedState = selectedState.trim().toUpperCase();
    if (normalizedState !== 'NY' && normalizedState !== 'NEW YORK') {
      return {
        isValid: false,
        message:
          'AlphaLux Cleaning is currently only servicing New York State. Please select New York.',
      };
    }
    if (isNewYorkZip(zipNumber)) return { isValid: true };
    return {
      isValid: false,
      message: `ZIP code ${cleanZip} is not valid for New York. Please enter a valid New York ZIP code.`,
    };
  }

  if (isNewYorkZip(zipNumber)) return { isValid: true };

  console.log(`❌ ZIP code ${cleanZip} rejected - outside New York State`);

  return {
    isValid: false,
    message: `Sorry, AlphaLux Cleaning is currently only servicing New York State. ZIP ${cleanZip} is outside our service area.`,
  };
}

export function getNearestServiceableZipCodes(_zipCode: string): string[] {
  // Suggest popular NY ZIPs to help customers who fat-fingered their entry.
  return ['10001', '11201', '11101', '11501', '10601'];
  // Manhattan, Brooklyn, Queens, Nassau, Westchester
}

export const SERVICE_AREA_INFO = {
  centerCity: 'New York State',
  radiusMiles: 0,
  contactPhone: '(857) 754-4557',
  contactEmail: 'support@alphaluxcleaning.com',
};
