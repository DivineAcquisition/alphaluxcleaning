import { useQuery } from '@tanstack/react-query';
import {
  fetchSmsStateNumbers,
  pickSupportContact,
  type SupportContact,
} from '@/lib/sms-state-numbers';

/**
 * Live OpenPhone support line from `sms_state_numbers`.
 * Pass a state code to prefer that market; otherwise the default row.
 */
export function useSupportContact(state?: string | null): SupportContact {
  const { data: rows = [] } = useQuery({
    queryKey: ['sms-state-numbers'],
    queryFn: fetchSmsStateNumbers,
    staleTime: 5 * 60 * 1000,
  });
  return pickSupportContact(rows, state);
}
