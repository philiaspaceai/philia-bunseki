import { Token, WordAnalysis, AnalysisStats } from '../types';
import { tokenize } from './tokenizer';
import { fetchJlptBatch, fetchBccwjBatch } from './supabase';

// Filter out irrelevant parts of speech
function isValidWord(token: Token): boolean {
  const pos = token.pos;
  const basicForm = token.basic_form;
  
  // Exclude particles, symbols, unknown
  if (pos === '助詞' || pos === '助動詞' || pos === '記号' || basicForm === '*') {
    return false;
  }
  return true;
}

export async function analyzeText(text: string): Promise<{
  stats: AnalysisStats;
  wordList: WordAnalysis[];
}> {
  const tokens = tokenize(text);
  const wordMap = new Map<string, WordAnalysis>();
  
  // 1. Initial Processing & Aggregation
  for (const token of tokens) {
    if (!isValidWord(token)) continue;

    const key = token.basic_form;
    if (wordMap.has(key)) {
      const entry = wordMap.get(key)!;
      entry.count++;
      // Save example sentence if not exists (simple approach: use surrounding context)
      // For now, we don't have easy context extraction in this loop, so skip.
    } else {
      wordMap.set(key, {
        token,
        jlptLevel: null,
        bccwjRank: null,
        isUnknown: true,
        count: 1
      });
    }
  }

  const uniqueWords = Array.from(wordMap.keys());

  // 2. Fetch Data
  const [jlptResults, bccwjResults] = await Promise.all([
    fetchJlptBatch(uniqueWords),
    fetchBccwjBatch(uniqueWords)
  ]);

  // 3. Map Data back to words
  const jlptMap = new Map(jlptResults.map((r: any) => [r.word, parseInt(r.tags || '0', 10)]));
  const bccwjMap = new Map(bccwjResults.map((r: any) => [r.word, r.id]));

  for (const [key, analysis] of wordMap) {
    if (jlptMap.has(key)) {
      analysis.jlptLevel = jlptMap.get(key) || null;
      analysis.isUnknown = false;
    }
    if (bccwjMap.has(key)) {
      analysis.bccwjRank = bccwjMap.get(key) || null;
      analysis.isUnknown = false;
    }
  }

  const wordList = Array.from(wordMap.values());
  const totalWords = tokens.filter(isValidWord).length;

  // 4. Calculate Stats
  const stats: AnalysisStats = {
    totalWords,
    uniqueWords: wordList.length,
    coverage: {
      n1: 0, n2: 0, n3: 0, n4: 0, n5: 0, unknown: 0
    },
    bccwjDistribution: {
      veryCommon: 0, common: 0, uncommon: 0, rare: 0, notRanked: 0
    },
    overallDifficulty: 'N5',
    recommendation: ''
  };

  // Coverage & Difficulty Logic
  const weightedDifficultySum = { n1: 0, n2: 0, n3: 0, n4: 0, n5: 0 };
  
  for (const w of wordList) {
    // JLPT Stats (weighted by occurrence)
    if (w.jlptLevel) {
      if (w.jlptLevel === 1) { stats.coverage.n1 += w.count; weightedDifficultySum.n1 += w.count; }
      else if (w.jlptLevel === 2) { stats.coverage.n2 += w.count; weightedDifficultySum.n2 += w.count; }
      else if (w.jlptLevel === 3) { stats.coverage.n3 += w.count; weightedDifficultySum.n3 += w.count; }
      else if (w.jlptLevel === 4) { stats.coverage.n4 += w.count; weightedDifficultySum.n4 += w.count; }
      else if (w.jlptLevel === 5) { stats.coverage.n5 += w.count; weightedDifficultySum.n5 += w.count; }
    } else {
      stats.coverage.unknown += w.count;
    }

    // BCCWJ Stats (Unique words only typically, but let's do weighted for distribution)
    const rank = w.bccwjRank;
    if (rank) {
      if (rank <= 1000) stats.bccwjDistribution.veryCommon += w.count;
      else if (rank <= 5000) stats.bccwjDistribution.common += w.count;
      else if (rank <= 10000) stats.bccwjDistribution.uncommon += w.count;
      else stats.bccwjDistribution.rare += w.count;
    } else {
      stats.bccwjDistribution.notRanked += w.count;
    }
  }

  // Determine Overall Difficulty
  // Heuristic: If > 20% words are N2+, it's N2. If > 20% are N3+, it's N3.
  const totalRanked = stats.coverage.n1 + stats.coverage.n2 + stats.coverage.n3 + stats.coverage.n4 + stats.coverage.n5;
  const pN1 = stats.coverage.n1 / totalRanked;
  const pN2 = stats.coverage.n2 / totalRanked;
  const pN3 = stats.coverage.n3 / totalRanked;
  
  if (pN1 > 0.05 || (pN1 + pN2) > 0.15) stats.overallDifficulty = 'N1';
  else if ((pN1 + pN2) > 0.25) stats.overallDifficulty = 'N2';
  else if ((pN1 + pN2 + pN3) > 0.40) stats.overallDifficulty = 'N3';
  else if ((stats.coverage.n4 / totalRanked) > 0.30) stats.overallDifficulty = 'N4';
  else stats.overallDifficulty = 'N5';

  stats.recommendation = `Recommended for learners around ${stats.overallDifficulty} level.`;

  return { stats, wordList: wordList.sort((a, b) => b.count - a.count) };
}