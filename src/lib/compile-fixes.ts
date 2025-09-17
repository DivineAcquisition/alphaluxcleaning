// Compile fixes for non-existent tables and functions
// This is a temporary workaround until proper database tables are created

declare global {
  interface Window {
    // Supabase client type overrides
    __SUPABASE_TYPE_FIX__: any;
  }
}

export {};