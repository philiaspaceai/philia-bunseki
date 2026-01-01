export const SUPABASE_URL = "https://xxnsvylzzkgcnubaegyv.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bnN2eWx6emtnY251YmFlZ3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDE0MjcsImV4cCI6MjA3OTk3NzQyN30.x0wz0v_qqvg6riMipKMr3IM30YnGaGs1b9uMvJRGG5M";

export const DB_NAME = "JimakuBunsekiDB";
export const DB_STORE = "analysis_history";

export const JLPT_COLORS = {
  n5: "#22c55e", // Green
  n4: "#84cc16", // Lime
  n3: "#eab308", // Yellow
  n2: "#f97316", // Orange
  n1: "#ef4444", // Red
};

export const FREQ_COLORS = {
  top1k: "#22c55e",
  top5k: "#84cc16",
  top10k: "#eab308",
  top20k: "#f97316",
  rare: "#ef4444",
};

// =========================================================
// RATING SYSTEM (UPDATED)
// =========================================================
// Beginner Friendly | 0-25   | Dark Green
// Easy              | 26-40  | Light Green
// Moderate          | 41-55  | Lime
// Intermediate      | 56-70  | Yellow
// Challenging       | 71-85  | Light Orange
// Advanced          | 86-105 | Dark Orange
// Expert            | 106+   | Red
// =========================================================

export const getRatingLabel = (score: number) => {
  if (score <= 25) return "Beginner Friendly";
  if (score <= 40) return "Easy";
  if (score <= 55) return "Moderate";
  if (score <= 70) return "Intermediate";
  if (score <= 85) return "Challenging";
  if (score <= 105) return "Advanced";
  return "Expert";
};

export const getRatingColor = (score: number) => {
  if (score <= 25) return "text-emerald-600 dark:text-emerald-400";    // Dark Green
  if (score <= 40) return "text-green-500 dark:text-green-400";        // Light Green
  if (score <= 55) return "text-lime-500 dark:text-lime-400";          // Lime
  if (score <= 70) return "text-yellow-500 dark:text-yellow-400";      // Yellow
  if (score <= 85) return "text-orange-400 dark:text-orange-300";      // Light Orange
  if (score <= 105) return "text-orange-600 dark:text-orange-500";     // Dark Orange
  return "text-red-600 dark:text-red-500";                             // Red
};

export const getBadgeStyle = (score: number) => {
  if (score <= 25) return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800";
  if (score <= 40) return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800";
  if (score <= 55) return "bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/40 dark:text-lime-300 dark:border-lime-800";
  if (score <= 70) return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800";
  if (score <= 85) return "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-800";
  if (score <= 105) return "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900/60 dark:text-orange-300 dark:border-orange-700";
  return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800";
};