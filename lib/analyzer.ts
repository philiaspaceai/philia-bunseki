import { supabase } from './supabase';
import { parseSRT, tokenizeText } from './tokenizer';
import { AnalysisResult, WordEntry, SubtitleLine } from '../types';

// ==========================================
// SCORING HELPERS
// ==========================================

const getJlptPoints = (level?: number): number => {
  switch (level) {
    case 5: return 5;
    case 4: return 10;
    case 3: return 15;
    case 2: return 20;
    case 1: return 30;
    default: return 0;
  }
};

const getBccwjPoints = (rank: number): number => {
  // Infinite step logic based on user's pattern:
  // 1-1000: 5 pts
  // 1001-2000: 10 pts
  // ... and so on.

  let points = 5;
  let currentMax = 1000;
  let rangeIncrement = 1000;

  while (rank > currentMax) {
    points += 5;
    currentMax += rangeIncrement;
    rangeIncrement += 1000;
  }

  return points;
};

// ==========================================
// RETRY HELPER
// ==========================================
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_RETRIES = 10;

// ==========================================
// MAIN ANALYZER
// ==========================================

export const analyzeSubtitle = async (
  files: File[], 
  animeName: string,
  onProgress: (msg: string, percent: number) => void
): Promise<AnalysisResult> => {
  
  // 1. Parse all files
  // Visually start at 0 since this is fast
  onProgress("Parsing subtitle files...", 0);
  let allLines: SubtitleLine[] = [];
  let fullRawText = "";

  for (const file of files) {
    const text = await file.text();
    const parsed = parseSRT(text);
    allLines = [...allLines, ...parsed];
    fullRawText += parsed.map(l => l.text).join(' ');
  }

  // 2. Tokenize & Count Occurrences
  // Keep it at 0 or very low because this is also usually fast
  onProgress("Analyzing morphology...", 0);
  const tokens = tokenizeText(fullRawText);
  
  // Map to store lemma -> count
  const lemmaCounts = new Map<string, number>();
  
  for (const t of tokens) {
      if (t.length > 0) {
          const currentCount = lemmaCounts.get(t) || 0;
          lemmaCounts.set(t, currentCount + 1);
      }
  }

  // 3. Batch Query Supabase
  // This is the main wait time. We map this phase to 0 -> 100% of the bar.
  onProgress("Querying dictionary database...", 0);
  const queryList = Array.from(lemmaCounts.keys());
  
  const BATCH_SIZE = 35; 
  const foundWordsMap = new Map<string, Omit<WordEntry, 'count'>>(); 

  for (let i = 0; i < queryList.length; i += BATCH_SIZE) {
    const batch = queryList.slice(i, i + BATCH_SIZE);
    
    // Politeness delay between batches (if not first batch)
    if (i > 0) await wait(200);

    // Current progress matches the loop iteration (0% to 100%)
    const percent = Math.round((i / queryList.length) * 100);
    onProgress(`Querying dictionary database... (${percent}%)`, percent);
    
    // --- FETCH BCCWJ (WITH RETRY) ---
    let bccwjData = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const { data, error } = await supabase
          .from('bccwj')
          .select('id, word, reading')
          .in('word', batch);
        
        if (!error) {
            bccwjData = data;
            break; // Success
        }

        if (attempt === MAX_RETRIES) {
            console.error(`BCCWJ Batch failed after ${MAX_RETRIES} attempts. Skipping.`, error);
        } else {
            // Wait with backoff: 1s, 2s, 3s...
            await wait(1000 * attempt);
        }
    }

    if (bccwjData) {
      for (const row of bccwjData) {
        if (!foundWordsMap.has(row.word)) {
          foundWordsMap.set(row.word, { id: row.id, word: row.word, reading: row.reading });
        }
      }
    }

    // --- FETCH JLPT (WITH RETRY) ---
    // Only query JLPT if we found words in this batch in BCCWJ (optimization)
    // Actually, we must query based on original batch to be safe, but we only attach if it exists in foundWordsMap.
    
    let jlptData = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const { data, error } = await supabase
          .from('jlpt')
          .select('word, tags')
          .in('word', batch);

        if (!error) {
            jlptData = data;
            break;
        }

        if (attempt === MAX_RETRIES) {
             console.error(`JLPT Batch failed after ${MAX_RETRIES} attempts. Skipping.`, error);
        } else {
             await wait(1000 * attempt);
        }
    }

    if (jlptData) {
      for (const row of jlptData) {
        // STRICT: Only attach JLPT info if the word already exists in foundWordsMap (from BCCWJ).
        if (foundWordsMap.has(row.word)) {
          const entry = foundWordsMap.get(row.word)!;
          entry.jlpt = row.tags;
        } 
      }
    }
  }

  // 4. Construct Final Word List & Stats
  onProgress("Finalizing analysis...", 100);
  const finalWordList: WordEntry[] = [];
  
  const jlptDist = { n1: 0, n2: 0, n3: 0, n4: 0, n5: 0 };
  const freqDist = { top1k: 0, top5k: 0, top10k: 0, top20k: 0, rare: 0 };
  
  let totalWeightedPoints = 0;
  let validTokenCount = 0; 

  lemmaCounts.forEach((count, lemma) => {
    const match = foundWordsMap.get(lemma);
    
    // STRICT FILTER 1: Must exist in BCCWJ DB
    if (!match) return;

    // Filter: Single Kanji with Rank > 10,000 (Noise/Bad Segmentation)
    const isSingleKanji = /^[一-龠]$/.test(lemma);
    if (isSingleKanji && match.id > 10000) return;

    // Create Entry
    const wordEntry: WordEntry = { ...match, count };
    finalWordList.push(wordEntry);
    validTokenCount += count;

    // --- Stats Update (BASED ON OCCURRENCE COUNT) ---
    // Update JLPT stats (Only if JLPT level exists)
    if (match.jlpt === 1) jlptDist.n1 += count;
    else if (match.jlpt === 2) jlptDist.n2 += count;
    else if (match.jlpt === 3) jlptDist.n3 += count;
    else if (match.jlpt === 4) jlptDist.n4 += count;
    else if (match.jlpt === 5) jlptDist.n5 += count;
    // Words with no JLPT level are ignored in the JLPT distribution (No Unknown Bar)

    // Frequency Distribution Update
    if (match.id <= 1000) freqDist.top1k += count;
    else if (match.id <= 5000) freqDist.top5k += count;
    else if (match.id <= 10000) freqDist.top10k += count;
    else if (match.id <= 20000) freqDist.top20k += count;
    else freqDist.rare += count; // Rank > 20000 goes here

    // --- RAW SCORING LOGIC ---
    const jlptPoints = getJlptPoints(match.jlpt);
    const bccwjPoints = getBccwjPoints(match.id);
    
    // Formula: (JLPT + BCCWJ) * Count
    totalWeightedPoints += ((jlptPoints + bccwjPoints) * count);
  });

  // Get Top 20 Most Difficult words
  const difficultWords = [...finalWordList]
    .sort((a, b) => {
       const ptsA = getJlptPoints(a.jlpt) + getBccwjPoints(a.id);
       const ptsB = getJlptPoints(b.jlpt) + getBccwjPoints(b.id);
       return ptsB - ptsA;
    })
    .slice(0, 20);
  
  const avgSentenceLength = allLines.length > 0 ? fullRawText.length / allLines.length : 0;

  onProgress("Done!", 100);

  return {
    id: crypto.randomUUID(),
    animeName,
    timestamp: Date.now(),
    totalWords: validTokenCount,
    avgSentenceLength,
    difficultyScore: Math.round(totalWeightedPoints / 1000), // Adjusted Score: Divided by 1000
    jlptDistribution: jlptDist,
    freqDistribution: freqDist,
    difficultWords
  };
};