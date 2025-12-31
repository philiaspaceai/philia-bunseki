// Supabase Configuration
export const SUPABASE_URL = "https://xxnsvylzzkgcnubaegyv.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bnN2eWx6emtnY251YmFlZ3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDE0MjcsImV4cCI6MjA3OTk3NzQyN30.x0wz0v_qqvg6riMipKMr3IM30YnGaGs1b9uMvJRGG5M";

// Analysis Constants
export const CHUNK_SIZE = 50; // Max batch size for Supabase queries

export const BCCWJ_RANGES = {
  Beginner: 1000,
  Elementary: 3000,
  Intermediate: 6000,
  Advanced: 10000,
  Expert: 9999999
};

export const JLPT_COLORS = {
  N5: '#22c55e', // Green
  N4: '#3b82f6', // Blue
  N3: '#a855f7', // Purple
  N2: '#f59e0b', // Amber
  N1: '#ef4444', // Red
  Unknown: '#94a3b8' // Slate
};

export const BCCWJ_COLORS = {
  Beginner: '#22c55e',
  Elementary: '#3b82f6',
  Intermediate: '#a855f7',
  Advanced: '#f59e0b',
  Expert: '#ef4444',
  Unknown: '#94a3b8'
};
