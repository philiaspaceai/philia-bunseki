import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xxnsvylzzkgcnubaegyv.supabase.co';
// WARNING: In a real production app, use environment variables.
// The user provided this specific key for this task.
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bnN2eWx6emtnY251YmFlZ3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDE0MjcsImV4cCI6MjA3OTk3NzQyN30.x0wz0v_qqvg6riMipKMr3IM30YnGaGs1b9uMvJRGG5M';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const BATCH_SIZE = 50;

/**
 * Batched fetch for JLPT levels
 */
export async function fetchJlptBatch(words: string[]) {
  const uniqueWords = Array.from(new Set(words));
  const chunks = [];
  for (let i = 0; i < uniqueWords.length; i += BATCH_SIZE) {
    chunks.push(uniqueWords.slice(i, i + BATCH_SIZE));
  }

  let results: any[] = [];
  
  // Process chunks in parallel with a limit (or sequentially to be safe with limits)
  // For simplicity and safety, we do sequential for now or limited parallel
  for (const chunk of chunks) {
    const { data, error } = await supabase
      .from('jlpt')
      .select('word, reading, tags')
      .in('word', chunk);

    if (error) {
      console.error('Error fetching JLPT data:', error);
      continue;
    }
    if (data) results = [...results, ...data];
  }
  return results;
}

/**
 * Batched fetch for BCCWJ frequency
 */
export async function fetchBccwjBatch(words: string[]) {
  const uniqueWords = Array.from(new Set(words));
  const chunks = [];
  for (let i = 0; i < uniqueWords.length; i += BATCH_SIZE) {
    chunks.push(uniqueWords.slice(i, i + BATCH_SIZE));
  }

  let results: any[] = [];

  for (const chunk of chunks) {
    const { data, error } = await supabase
      .from('bccwj')
      .select('id, word, reading')
      .in('word', chunk);
    
    if (error) {
      console.error('Error fetching BCCWJ data:', error);
      continue;
    }
    if (data) results = [...results, ...data];
  }
  return results;
}