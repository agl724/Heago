import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://uvyinousztigrbqcfwje.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2eWlub3VzenRpZ3JicWNmd2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQ5OTgsImV4cCI6MjA3MjA1MDk5OH0.m8ElCS2QZShvTkK_OrEmWPcoZ3we7ZFdWVFYnKRVUeI";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
