// Complete list of US states with abbreviations and full names
export interface USState {
  abbreviation: string;
  name: string;
}

export const US_STATES: USState[] = [
  { abbreviation: "AL", name: "Alabama" },
  { abbreviation: "AK", name: "Alaska" },
  { abbreviation: "AZ", name: "Arizona" },
  { abbreviation: "AR", name: "Arkansas" },
  { abbreviation: "CA", name: "California" },
  { abbreviation: "CO", name: "Colorado" },
  { abbreviation: "CT", name: "Connecticut" },
  { abbreviation: "DE", name: "Delaware" },
  { abbreviation: "DC", name: "District of Columbia" },
  { abbreviation: "FL", name: "Florida" },
  { abbreviation: "GA", name: "Georgia" },
  { abbreviation: "HI", name: "Hawaii" },
  { abbreviation: "ID", name: "Idaho" },
  { abbreviation: "IL", name: "Illinois" },
  { abbreviation: "IN", name: "Indiana" },
  { abbreviation: "IA", name: "Iowa" },
  { abbreviation: "KS", name: "Kansas" },
  { abbreviation: "KY", name: "Kentucky" },
  { abbreviation: "LA", name: "Louisiana" },
  { abbreviation: "ME", name: "Maine" },
  { abbreviation: "MD", name: "Maryland" },
  { abbreviation: "MA", name: "Massachusetts" },
  { abbreviation: "MI", name: "Michigan" },
  { abbreviation: "MN", name: "Minnesota" },
  { abbreviation: "MS", name: "Mississippi" },
  { abbreviation: "MO", name: "Missouri" },
  { abbreviation: "MT", name: "Montana" },
  { abbreviation: "NE", name: "Nebraska" },
  { abbreviation: "NV", name: "Nevada" },
  { abbreviation: "NH", name: "New Hampshire" },
  { abbreviation: "NJ", name: "New Jersey" },
  { abbreviation: "NM", name: "New Mexico" },
  { abbreviation: "NY", name: "New York" },
  { abbreviation: "NC", name: "North Carolina" },
  { abbreviation: "ND", name: "North Dakota" },
  { abbreviation: "OH", name: "Ohio" },
  { abbreviation: "OK", name: "Oklahoma" },
  { abbreviation: "OR", name: "Oregon" },
  { abbreviation: "PA", name: "Pennsylvania" },
  { abbreviation: "RI", name: "Rhode Island" },
  { abbreviation: "SC", name: "South Carolina" },
  { abbreviation: "SD", name: "South Dakota" },
  { abbreviation: "TN", name: "Tennessee" },
  { abbreviation: "TX", name: "Texas" },
  { abbreviation: "UT", name: "Utah" },
  { abbreviation: "VT", name: "Vermont" },
  { abbreviation: "VA", name: "Virginia" },
  { abbreviation: "WA", name: "Washington" },
  { abbreviation: "WV", name: "West Virginia" },
  { abbreviation: "WI", name: "Wisconsin" },
  { abbreviation: "WY", name: "Wyoming" }
];

// Helper function to get state name by abbreviation
export const getStateNameByAbbreviation = (abbreviation: string): string | undefined => {
  return US_STATES.find(state => state.abbreviation === abbreviation)?.name;
};

// Helper function to get state abbreviation by name
export const getStateAbbreviationByName = (name: string): string | undefined => {
  return US_STATES.find(state => state.name === name)?.abbreviation;
};

// Export states as array of full names (for components that need full names)
export const STATE_NAMES = US_STATES.map(state => state.name);

// Export states as array of abbreviations (for components that need abbreviations)
export const STATE_ABBREVIATIONS = US_STATES.map(state => state.abbreviation);

/**
 * AlphaLux Cleaning service area.
 *
 * The app presently only services New York State, so any address /
 * service-area UI should use SERVICE_AREA_STATES instead of the full
 * US_STATES list. US_STATES is kept as canonical reference data in
 * case we need it for non-service use cases (shipping forms,
 * subcontractor background-check workflows, etc.), but it should not
 * be shown as options in a public-facing address or service-area
 * picker.
 */
export const SERVICE_AREA_STATES: USState[] = US_STATES.filter(
  (state) => state.abbreviation === 'NY',
);