// Live OpenPhone market registry. Phone numbers, OpenPhone ids and
// timezones live in `sms_state_numbers` — never bake them into the
// client. ZIP → state is geographic inference (USPS ranges), not a
// phone-number fallback.

import { supabase } from '@/integrations/supabase/client';

export interface SmsStateNumber {
  state_code: string;
  phone_e164: string;
  openphone_phone_id: string | null;
  timezone: string;
  is_default: boolean;
}

export function formatUsNumber(e164: string | null | undefined): string {
  const digits = String(e164 || '').replace(/\D/g, '');
  const core = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (core.length !== 10) return String(e164 || '');
  return `(${core.slice(0, 3)}) ${core.slice(3, 6)}-${core.slice(6)}`;
}

/** Infer a service state from a US ZIP (the four live markets). */
export function stateFromZip(zip: string | null | undefined): string | null {
  const five = String(zip || '').trim().slice(0, 5);
  if (!/^\d{5}$/.test(five)) return null;
  const n = parseInt(five, 10);
  if (n >= 7000 && n <= 8999) return 'NJ';
  if (n >= 10000 && n <= 14999) return 'NY';
  if (n === 6390) return 'NY';
  if (n >= 90000 && n <= 96199) return 'CA';
  if ((n >= 75000 && n <= 79999) || (n >= 88500 && n <= 88599)) return 'TX';
  return null;
}

export async function fetchSmsStateNumbers(): Promise<SmsStateNumber[]> {
  const { data, error } = await (supabase as any)
    .from('sms_state_numbers')
    .select('state_code, phone_e164, openphone_phone_id, timezone, is_default')
    .order('state_code');
  if (error) throw error;
  return (data || []) as SmsStateNumber[];
}

export function defaultStateCode(rows: SmsStateNumber[]): string {
  return rows.find((r) => r.is_default)?.state_code || rows[0]?.state_code || '';
}

export function displayNumberForState(
  rows: SmsStateNumber[],
  state: string | null | undefined,
): string {
  const code = String(state || '').toUpperCase();
  const row = rows.find((r) => r.state_code === code);
  return row ? formatUsNumber(row.phone_e164) : '';
}

export interface SupportContact {
  e164: string;
  display: string;
  tel: string;
  sms: string;
}

/** Default (or state-matched) support line from the live registry. */
export function pickSupportContact(
  rows: SmsStateNumber[],
  state?: string | null,
): SupportContact {
  const empty: SupportContact = { e164: '', display: '', tel: '', sms: '' };
  if (!rows.length) return empty;
  const code = String(state || '').toUpperCase();
  const row =
    (code && rows.find((r) => r.state_code === code)) ||
    rows.find((r) => r.is_default) ||
    rows[0];
  if (!row?.phone_e164) return empty;
  return {
    e164: row.phone_e164,
    display: formatUsNumber(row.phone_e164),
    tel: `tel:${row.phone_e164}`,
    sms: `sms:${row.phone_e164}`,
  };
}
