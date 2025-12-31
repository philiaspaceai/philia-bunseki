import { JLPTRow, BCCWJRow, AnalysisResult, WordAnalysis, BCCWJLevel } from '../types';
import { BCCWJ_RANGES } from '../constants';
import { v4 as uuidv4 } from 'uuid';

export const analyzeSubtitle = (
  fileName: string,
  tokens: string[],
  jlptData: JLPTRow[],
  bccwjData: BCCWJRow[]
): AnalysisResult => {
  
  const totalWords = tokens.length;
  const uniqueWordsSet = new Set(tokens);
  const uniqueWordsCount = uniqueWordsSet.size;

  // Create lookup maps for O(1) access
  const jlptMap = new Map<string, JLPTRow>();
  jlptData.forEach(row => jlptMap.set(row.word, row));

  const bccwjMap = new Map<string, BCCWJRow>();
  bccwjData.forEach(row => bccwjMap.set(row.word, row));

  // Count word frequencies
  const wordCounts = new Map<string, number>();
  tokens.forEach(t => wordCounts.set(t, (wordCounts.get(t) || 0) + 1));

  const wordList: WordAnalysis[] = [];
  let foundInDbCount = 0;

  // Stats Counters
  const jlptStatsRaw = { N1: 0, N2: 0, N3: 0, N4: 0, N5: 0, Unknown: 0 };
  const bccwjStatsRaw = { Beginner: 0, Elementary: 0, Intermediate: 0, Advanced: 0, Expert: 0, Unknown: 0 };

  // Analyze each unique word
  uniqueWordsSet.forEach(word => {
    const count = wordCounts.get(word) || 0;
    const jlptInfo = jlptMap.get(word);
    const bccwjInfo = bccwjMap.get(word);

    // Reading fallback
    const reading = jlptInfo?.reading || bccwjInfo?.reading || '－';

    // 1. JLPT Analysis
    let jlptLevel: number | null = null;
    if (jlptInfo) {
      jlptLevel = jlptInfo.tags;
      foundInDbCount++;
    }

    if (jlptLevel === 1) jlptStatsRaw.N1 += count;
    else if (jlptLevel === 2) jlptStatsRaw.N2 += count;
    else if (jlptLevel === 3) jlptStatsRaw.N3 += count;
    else if (jlptLevel === 4) jlptStatsRaw.N4 += count;
    else if (jlptLevel === 5) jlptStatsRaw.N5 += count;
    else jlptStatsRaw.Unknown += count;

    // 2. BCCWJ Analysis
    let bccwjId: number | null = null;
    let bccwjLevel: BCCWJLevel = 'Unknown';
    
    if (bccwjInfo) {
      bccwjId = bccwjInfo.id;
      if (!jlptInfo) foundInDbCount++; // If found here but not JLPT, it counts as covered
    }

    if (bccwjId) {
      if (bccwjId <= BCCWJ_RANGES.Beginner) bccwjLevel = 'Beginner';
      else if (bccwjId <= BCCWJ_RANGES.Elementary) bccwjLevel = 'Elementary';
      else if (bccwjId <= BCCWJ_RANGES.Intermediate) bccwjLevel = 'Intermediate';
      else if (bccwjId <= BCCWJ_RANGES.Advanced) bccwjLevel = 'Advanced';
      else bccwjLevel = 'Expert';
    }

    // Increment BCCWJ stats
    bccwjStatsRaw[bccwjLevel] += count;

    wordList.push({
      word,
      reading,
      count,
      jlptLevel,
      bccwjId,
      bccwjLevel
    });
  });

  // Sort wordlist by frequency
  wordList.sort((a, b) => b.count - a.count);

  // Calculate Percentages
  const calculatePercentage = (val: number) => totalWords > 0 ? parseFloat(((val / totalWords) * 100).toFixed(1)) : 0;

  const jlptStats = {
    N5: { count: jlptStatsRaw.N5, percentage: calculatePercentage(jlptStatsRaw.N5) },
    N4: { count: jlptStatsRaw.N4, percentage: calculatePercentage(jlptStatsRaw.N4) },
    N3: { count: jlptStatsRaw.N3, percentage: calculatePercentage(jlptStatsRaw.N3) },
    N2: { count: jlptStatsRaw.N2, percentage: calculatePercentage(jlptStatsRaw.N2) },
    N1: { count: jlptStatsRaw.N1, percentage: calculatePercentage(jlptStatsRaw.N1) },
    Unknown: { count: jlptStatsRaw.Unknown, percentage: calculatePercentage(jlptStatsRaw.Unknown) },
  };

  const bccwjStats = {
    Beginner: { count: bccwjStatsRaw.Beginner, percentage: calculatePercentage(bccwjStatsRaw.Beginner) },
    Elementary: { count: bccwjStatsRaw.Elementary, percentage: calculatePercentage(bccwjStatsRaw.Elementary) },
    Intermediate: { count: bccwjStatsRaw.Intermediate, percentage: calculatePercentage(bccwjStatsRaw.Intermediate) },
    Advanced: { count: bccwjStatsRaw.Advanced, percentage: calculatePercentage(bccwjStatsRaw.Advanced) },
    Expert: { count: bccwjStatsRaw.Expert, percentage: calculatePercentage(bccwjStatsRaw.Expert) },
    Unknown: { count: bccwjStatsRaw.Unknown, percentage: calculatePercentage(bccwjStatsRaw.Unknown) },
  };

  // CONCLUSIONS

  // JLPT Logic: Weighted Average of known words
  // N5=1 point, N1=5 points. Higher average = harder.
  // Unknown = 6 points (hardest).
  let jlptScoreSum = 0;
  let jlptWeightTotal = 0;

  // Simple heuristic for Conclusion Label
  let jlptConclusion = "Unknown";
  // Find the highest density
  const n5n4 = jlptStats.N5.percentage + jlptStats.N4.percentage;
  const n3 = jlptStats.N3.percentage;
  const n2n1 = jlptStats.N2.percentage + jlptStats.N1.percentage;
  const unk = jlptStats.Unknown.percentage;

  if (unk > 40) jlptConclusion = "High Unknown (N1+)";
  else if (n2n1 > 20) jlptConclusion = "N1-N2 (Advanced)";
  else if (n3 > 25) jlptConclusion = "N3 (Intermediate)";
  else if (n5n4 > 50) jlptConclusion = "N4-N5 (Beginner)";
  else jlptConclusion = "N3-N4 (Mixed)";

  // BCCWJ Logic
  let bccwjConclusion = "Unknown";
  const advExp = bccwjStats.Advanced.percentage + bccwjStats.Expert.percentage;
  const begElem = bccwjStats.Beginner.percentage + bccwjStats.Elementary.percentage;
  
  if (advExp > 15) bccwjConclusion = "Native Level";
  else if (begElem > 70) bccwjConclusion = "Daily Conversation";
  else bccwjConclusion = "Standard Japanese";

  // Overall Score (0-100, where 100 is hardest)
  // Base score on N-levels + Unknown penalty
  const difficultyScore = 
    (jlptStats.N5.percentage * 1) + 
    (jlptStats.N4.percentage * 3) + 
    (jlptStats.N3.percentage * 6) + 
    (jlptStats.N2.percentage * 8) + 
    (jlptStats.N1.percentage * 10) + 
    (jlptStats.Unknown.percentage * 9); 
  
  // Normalize roughly to 0-100 (max possible is roughly 1000 if 100% N1)
  const finalScore = Math.min(100, Math.round(difficultyScore / 10));

  let recommendation = "";
  if (finalScore < 30) recommendation = "Cocok untuk pemula (N5/N4).";
  else if (finalScore < 50) recommendation = "Cocok untuk level menengah (N3).";
  else if (finalScore < 70) recommendation = "Tantangan bagus untuk N2.";
  else recommendation = "Sangat sulit, direkomendasikan untuk N1 atau Native.";

  return {
    id: uuidv4(),
    fileName,
    title: fileName.replace('.srt', ''),
    timestamp: Date.now(),
    totalWords,
    uniqueWords: uniqueWordsCount,
    coverage: parseFloat(((foundInDbCount / uniqueWordsCount) * 100).toFixed(1)),
    jlptStats,
    bccwjStats,
    jlptConclusion,
    bccwjConclusion,
    overallScore: finalScore,
    recommendation,
    wordList
  };
};