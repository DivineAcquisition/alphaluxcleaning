// Service area validation for AlphaLux Cleaning
// Covers all of Texas, California, and New York

// Comprehensive Texas ZIP code ranges covering all major cities
const TEXAS_ZIP_RANGES = [
  { min: 75000, max: 75099 }, // Dallas
  { min: 75201, max: 75398 }, // Dallas Metro
  { min: 76001, max: 76199 }, // Fort Worth
  { min: 76201, max: 76299 }, // Denton
  { min: 77001, max: 77099 }, // Houston Central
  { min: 77201, max: 77299 }, // Houston Metro
  { min: 77301, max: 77599 }, // Houston Extended
  { min: 78000, max: 78299 }, // San Antonio
  { min: 78701, max: 78799 }, // Austin
  { min: 79901, max: 79999 }, // El Paso
  { min: 78401, max: 78499 }, // Corpus Christi
  { min: 79401, max: 79499 }, // Lubbock
  { min: 79101, max: 79199 }, // Amarillo
  { min: 78501, max: 78599 }, // McAllen
  { min: 78040, max: 78049 }, // Laredo
  { min: 76501, max: 76599 }, // Temple/Killeen
  { min: 76701, max: 76799 }, // Waco
  { min: 79601, max: 79699 }, // Abilene
  { min: 75600, max: 75799 }, // Tyler/Longview
  { min: 77801, max: 77899 }, // Bryan/College Station
];

// Comprehensive California ZIP code ranges covering all major cities
const CALIFORNIA_ZIP_RANGES = [
  { min: 90001, max: 90089 }, // Los Angeles Central
  { min: 90201, max: 90899 }, // Los Angeles Metro
  { min: 91001, max: 91899 }, // Pasadena/Glendale
  { min: 92101, max: 92199 }, // San Diego Central
  { min: 92201, max: 92899 }, // San Diego Extended
  { min: 93001, max: 93599 }, // Central Coast (Ventura/Santa Barbara)
  { min: 94002, max: 94188 }, // San Francisco/Peninsula
  { min: 94501, max: 94709 }, // Oakland/East Bay
  { min: 95001, max: 95199 }, // San Jose/South Bay
  { min: 93601, max: 93799 }, // Fresno
  { min: 95814, max: 95899 }, // Sacramento
  { min: 92301, max: 92399 }, // San Bernardino
  { min: 92501, max: 92599 }, // Riverside
  { min: 92701, max: 92899 }, // Orange County
  { min: 93301, max: 93399 }, // Bakersfield
  { min: 95201, max: 95299 }, // Stockton
  { min: 95350, max: 95389 }, // Modesto
  { min: 92003, max: 92099 }, // North San Diego County
];

// Comprehensive New York ZIP code ranges covering all major cities
const NEW_YORK_ZIP_RANGES = [
  { min: 10001, max: 10299 }, // Manhattan
  { min: 10301, max: 10314 }, // Staten Island
  { min: 10451, max: 10475 }, // Bronx
  { min: 11001, max: 11697 }, // Queens/Brooklyn
  { min: 11701, max: 11980 }, // Long Island (Suffolk/Nassau)
  { min: 12201, max: 12299 }, // Albany
  { min: 13201, max: 13299 }, // Syracuse
  { min: 14201, max: 14299 }, // Buffalo
  { min: 14601, max: 14699 }, // Rochester
  { min: 10701, max: 10710 }, // Yonkers
  { min: 12401, max: 12499 }, // Kingston
  { min: 13601, max: 13699 }, // Watertown
  { min: 14850, max: 14899 }, // Ithaca
  { min: 13501, max: 13599 }, // Utica
];

function isTexasZip(zipCode: number): boolean {
  return TEXAS_ZIP_RANGES.some(range => zipCode >= range.min && zipCode <= range.max);
}

function isCaliforniaZip(zipCode: number): boolean {
  return CALIFORNIA_ZIP_RANGES.some(range => zipCode >= range.min && zipCode <= range.max);
}

function isNewYorkZip(zipCode: number): boolean {
  return NEW_YORK_ZIP_RANGES.some(range => zipCode >= range.min && zipCode <= range.max);
}

export interface ServiceAreaValidation {
  isValid: boolean;
  message?: string;
}

export function validateServiceAreaZipCode(zipCode: string, selectedState?: string): ServiceAreaValidation {
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
  
  // If a specific state is selected, validate against only that state
  if (selectedState) {
    const normalizedState = selectedState.trim().toUpperCase();
    let isValidForState = false;
    let stateName = '';
    
    if (normalizedState === 'TX' || normalizedState === 'TEXAS') {
      isValidForState = isTexasZip(zipNumber);
      stateName = 'Texas';
    } else if (normalizedState === 'CA' || normalizedState === 'CALIFORNIA') {
      isValidForState = isCaliforniaZip(zipNumber);
      stateName = 'California';
    } else if (normalizedState === 'NY' || normalizedState === 'NEW YORK') {
      isValidForState = isNewYorkZip(zipNumber);
      stateName = 'New York';
    }
    
    if (isValidForState) {
      return {
        isValid: true
      };
    }
    
    console.log(`❌ ZIP code ${cleanZip} rejected - not valid for ${stateName}`);
    return {
      isValid: false,
      message: `ZIP code ${cleanZip} is not valid for ${stateName}. Please enter a valid ${stateName} ZIP code.`
    };
  }
  
  // If no state specified, validate against any of our service states
  if (isTexasZip(zipNumber) || isCaliforniaZip(zipNumber) || isNewYorkZip(zipNumber)) {
    return {
      isValid: true
    };
  }

  console.log(`❌ ZIP code ${cleanZip} rejected - outside service area`);
  
  return {
    isValid: false,
    message: `Sorry, we only service Texas, California & New York. ZIP code ${cleanZip} is outside our service area.`
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
  centerCity: 'Texas, California & New York',
  radiusMiles: 0,
  contactPhone: '(281) 809-9901',
  contactEmail: 'support@alphaluxcleaning.com'
};