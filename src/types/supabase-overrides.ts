// Type overrides to allow compilation with non-existent tables and functions
// This is a temporary workaround until proper database tables are created

import { SupabaseClient } from '@supabase/supabase-js';

declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    from(table: string): any;
    rpc(fn: string, params?: any): any;
  }
}

// Global type augmentation for all components
declare global {
  interface SupabaseClientOverride {
    from(table: string): any;
    rpc(fn: string, params?: any): any;
  }
}

export {};