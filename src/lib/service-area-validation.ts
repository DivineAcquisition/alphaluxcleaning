// Service area validation for Bay Area Cleaning Services
// Covers 40-mile radius from Baytown, Texas

const BAYTOWN_SERVICE_AREA_ZIP_CODES = [
  // Baytown area
  "77520", "77521", "77522", "77523", "77562",
  
  // East Houston
  "77015", "77029", "77049", "77078", "77087", "77093",
  
  // Pasadena area
  "77502", "77503", "77504", "77505", "77506", "77507", "77508",
  
  // Deer Park area
  "77536",
  
  // La Porte area
  "77571", "77572",
  
  // Channelview area
  "77530",
  
  // Mont Belvieu area
  "77580",
  
  // Crosby area
  "77532",
  
  // Huffman area
  "77336",
  
  // Humble area
  "77338", "77346", "77347",
  
  // Kingwood area
  "77339", "77345",
  
  // Atascocita area
  "77346",
  
  // Additional Houston northeast areas
  "77013", "77016", "77026", "77039", "77040", "77041", "77050", 
  "77058", "77059", "77075", "77076", "77088", "77090", "77091",
  
  // Galena Park area
  "77547",
  
  // Jacinto City area
  "77029",
  
  // Sheldon area
  "77049",
  
  // Additional surrounding areas within 40 miles
  "77044", "77060", "77061", "77062", "77089", "77095"
];

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

  // Clean the zip code (remove any non-numeric characters except dash)
  const cleanZip = zipCode.replace(/[^0-9-]/g, '');
  
  // Handle 5-digit and 9-digit zip codes
  const zipToCheck = cleanZip.split('-')[0];
  
  if (zipToCheck.length !== 5) {
    return {
      isValid: false,
      message: 'Please enter a valid 5-digit ZIP code'
    };
  }

  if (BAYTOWN_SERVICE_AREA_ZIP_CODES.includes(zipToCheck)) {
    return {
      isValid: true
    };
  }

  return {
    isValid: false,
    message: `Sorry, we don't currently service ${zipToCheck}. We serve the Greater Baytown area within 40 miles. Contact us for special requests.`
  };
}

export function getNearestServiceableZipCodes(zipCode: string): string[] {
  // Simple logic to suggest nearby serviceable zip codes
  const zip = parseInt(zipCode);
  const nearby = BAYTOWN_SERVICE_AREA_ZIP_CODES
    .map(serviceZip => ({
      zip: serviceZip,
      distance: Math.abs(parseInt(serviceZip) - zip)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(item => item.zip);
    
  return nearby;
}

export const SERVICE_AREA_INFO = {
  centerCity: 'Baytown, TX',
  radiusMiles: 40,
  contactPhone: '(281) 555-0123',
  contactEmail: 'service@bayareacleaning.com'
};