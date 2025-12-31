import { createClient } from '@supabase/supabase-js';
import { DB_BCCWJ, DB_JLPT, JLPTLevel, BCCWJLevel } from '../types';

// Hardcoded as per user request for this specific app instance
const SUPABASE_URL = 'https://xxnsvylzzkgcnubaegyv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bnN2eWx6emtnY251YmFlZ3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDE0MjcsImV4cCI6MjA3OTk3NzQyN30.x0wz0v_qqvg6riMipKMr3IM30YnGaGs1b9uMvJRGG5M';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to chunk arrays
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

export const fetchWordMetadata = async (
  uniqueWords: string[], 
  onProgress: (progress: number) => void
): Promise<{ jlptMap: Map<string, JLPTLevel>; bccwjMap: Map<string, { level: BCCWJLevel; rank: number }> }> => {
  
  const jlptMap = new Map<string, JLPTLevel>();
  const bccwjMap = new Map<string, { level: BCCWJLevel; rank: number }>();

  // Optimize: Split into chunks of 50 for Supabase "in" query limits
  const chunks = chunkArray(uniqueWords, 50);
  const totalChunks = chunks.length;

  // We process chunks in parallel batches to be faster but not overwhelm connection
  const BATCH_LIMIT = 5; 

  for (let i = 0; i < totalChunks; i += BATCH_LIMIT) {
    const currentBatch = chunks.slice(i, i + BATCH_LIMIT);
    
    await Promise.all(currentBatch.map(async (chunk) => {
      // Fetch JLPT
      const { data: jlptData } = await supabase
        .from('jlpt')
        .select('word, tags')
        .in('word', chunk);

      if (jlptData) {
        (jlptData as unknown as DB_JLPT[]).forEach((row) => {
          let level: JLPTLevel = 'Unknown';
          if (row.tags === 1) level = 'N1';
          if (row.tags === 2) level = 'N2';
          if (row.tags === 3) level = 'N3';
          if (row.tags === 4) level = 'N4';
          if (row.tags === 5) level = 'N5';
          jlptMap.set(row.word, level);
        });
      }

      // Fetch BCCWJ
      const { data: bccwjData } = await supabase
        .from('bccwj')
        .select('id, word')
        .in('word', chunk);

      if (bccwjData) {
        (bccwjData as unknown as DB_BCCWJ[]).forEach((row) => {
          let level: BCCWJLevel = 'Unknown';
          if (row.id <= 1000) level = 'Beginner';
          else if (row.id <= 3000) level = 'Elementary';
          else if (row.id <= 6000) level = 'Intermediate';
          else if (row.id <= 10000) level = 'Advanced';
          else level = 'Expert';
          
          bccwjMap.set(row.word, { level, rank: row.id });
        });
      }
    }));

    onProgress(Math.round(((i + currentBatch.length) / totalChunks) * 100));
  }

  return { jlptMap, bccwjMap };
};
