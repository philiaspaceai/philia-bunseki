
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxnsvylzzkgcnubaegyv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bnN2eWx6emtnY251YmFlZ3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDE0MjcsImV4cCI6MjA3OTk3NzQyN30.x0wz0v_qqvg6riMipKMr3IM30YnGaGs1b9uMvJRGG5M';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be provided.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
