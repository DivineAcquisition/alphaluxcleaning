export interface DeepCleanRecommendation {
  shouldRecommend: boolean;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
}

export function getDeepCleanRecommendation(
  lastCleanedTimeline: string
): DeepCleanRecommendation {
  switch (lastCleanedTimeline) {
    case 'within_month':
      return {
        shouldRecommend: false,
        reason: '',
        urgency: 'low',
      };
    
    case '1_2_months':
      return {
        shouldRecommend: false,
        reason: '',
        urgency: 'low',
      };
    
    case '2_6_months':
      return {
        shouldRecommend: true,
        reason: 'Since it\'s been 2-6 months, we recommend starting with a Deep Cleaning for best results. This ensures a thorough reset before easier maintenance cleanings.',
        urgency: 'medium',
      };
    
    case '6_plus_months':
    case 'never':
      return {
        shouldRecommend: true,
        reason: 'Since your home hasn\'t been professionally cleaned in a while, we strongly recommend starting with a Deep Cleaning. This provides the best foundation for ongoing maintenance.',
        urgency: 'high',
      };
    
    default:
      return {
        shouldRecommend: false,
        reason: '',
        urgency: 'low',
      };
  }
}
