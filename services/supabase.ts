import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY, CHUNK_SIZE } from '../constants';
import { JLPTRow, BCCWJRow } from '../types';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const fetchJLPTData = async (words: string[]): Promise<JLPTRow[]> => {
  if (words.length === 0) return [];
  
  let allRows: JLPTRow[] = [];
  const uniqueWords = Array.from(new Set(words));
  
  // Batch processing
  for (let i = 0; i < uniqueWords.length; i += CHUNK_SIZE) {
    const chunk = uniqueWords.slice(i, i + CHUNK_SIZE);
    
    const { data, error } = await supabase
      .from('jlpt')
      .select('word, reading, tags')
      .in('word', chunk);
      
    if (error) {
      console.error('Error fetching JLPT chunk:', error);
      continue; 
    }
    
    if (data) {
      allRows = [...allRows, ...data as JLPTRow[]];
    }
  }
  return allRows;
};

export const fetchBCCWJData = async (words: string[]): Promise<BCCWJRow[]> => {
  if (words.length === 0) return [];

  let allRows: BCCWJRow[] = [];
  const uniqueWords = Array.from(new Set(words));
  
  for (let i = 0; i < uniqueWords.length; i += CHUNK_SIZE) {
    const chunk = uniqueWords.slice(i, i + CHUNK_SIZE);
    
    const { data, error } = await supabase
      .from('bccwj')
      .select('id, word, reading')
      .in('word', chunk);

    if (error) {
      console.error('Error fetching BCCWJ chunk:', error);
      continue;
    }
    
    if (data) {
      allRows = [...allRows, ...data as BCCWJRow[]];
    }
  }
  return allRows;
};