import { JLPTLevel, BCCWJLevel, Statistics, WordData, Token } from '../types';
import { fetchWordMetadata } from './supabaseClient';

const JLPT_ORDER = ['N5', 'N4', 'N3', 'N2', 'N1', 'Unknown'];
const BCCWJ_ORDER = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert', 'Unknown'];

export const analyzeSubtitle = async (
  tokens: Token[], 
  onProgress: (msg: string, val: number) => void
): Promise<{ stats: Statistics; allWords: WordData[] }> => {
  
  onProgress('Menghitung frekuensi kata...', 10);
  
  // 1. Count frequencies of lemmas (dictionary forms)
  const frequencyMap = new Map<string, number>();
  // Filter out non-japanese or symbols roughly
  const validTokens = tokens.filter(t => 
    t.partOfSpeech && 
    !['Symbol', 'Punctuation'].includes(t.partOfSpeech[0]) &&
    /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(t.dictionaryForm)
  );

  validTokens.forEach(token => {
    const word = token.dictionaryForm;
    frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1);
  });

  const uniqueWords = Array.from(frequencyMap.keys());
  const totalWords = validTokens.length;

  onProgress('Mengambil data JLPT & BCCWJ dari database...', 20);

  // 2. Fetch Metadata
  const { jlptMap, bccwjMap } = await fetchWordMetadata(uniqueWords, (p) => {
    onProgress('Query Database...', 20 + (p * 0.6)); // Map 0-100 to 20-80 range
  });

  onProgress('Menganalisis skor...', 90);

  // 3. Construct Word Data
  const allWords: WordData[] = uniqueWords.map(word => {
    const jlpt = jlptMap.get(word) || 'Unknown';
    const bccwjData = bccwjMap.get(word);
    const bccwj = bccwjData?.level || 'Unknown';
    
    return {
      word,
      reading: '', // Ideally Supabase returns this, assume word for now if missing
      jlpt,
      bccwj,
      frequency_rank: bccwjData?.rank,
      count: frequencyMap.get(word) || 0
    };
  });

  // 4. Statistics Calculation
  const jlptStats: Record<JLPTLevel, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0, Unknown: 0 };
  const bccwjStats: Record<BCCWJLevel, number> = { Beginner: 0, Elementary: 0, Intermediate: 0, Advanced: 0, Expert: 0, Unknown: 0 };

  let coveredWords = 0;
  let difficultyScoreAcc = 0;

  // Weightings for score (Higher = Harder)
  const jlptWeights = { N5: 1, N4: 2, N3: 4, N2: 6, N1: 9, Unknown: 10 };
  const bccwjWeights = { Beginner: 1, Elementary: 2, Intermediate: 4, Advanced: 6, Expert: 8, Unknown: 10 };

  allWords.forEach(w => {
    jlptStats[w.jlpt]++;
    bccwjStats[w.bccwj]++;

    if (w.jlpt !== 'Unknown' || w.bccwj !== 'Unknown') {
      coveredWords++;
    }

    // Weighted score based on frequency in subtitle
    // A word appearing 10 times impacts difficulty more than once? 
    // Usually difficulty is defined by the *unique* vocabulary needed.
    // Let's use unique words for difficulty to assess the "knowledge required".
    difficultyScoreAcc += (jlptWeights[w.jlpt] * 0.6) + (bccwjWeights[w.bccwj] * 0.4);
  });

  // Calculate percentages
  const jlptDist: any = {};
  JLPT_ORDER.forEach(k => {
    jlptDist[k] = { count: jlptStats[k as JLPTLevel], percentage: Math.round((jlptStats[k as JLPTLevel] / uniqueWords.length) * 100) };
  });

  const bccwjDist: any = {};
  BCCWJ_ORDER.forEach(k => {
    bccwjDist[k] = { count: bccwjStats[k as BCCWJLevel], percentage: Math.round((bccwjStats[k as BCCWJLevel] / uniqueWords.length) * 100) };
  });

  // Overall Score (0-100)
  // Max possible avg weight is roughly 10 (All Unknown/N1). Min is 1.
  const avgWeight = uniqueWords.length > 0 ? difficultyScoreAcc / uniqueWords.length : 0;
  // Normalize 1..10 to 0..100 where 100 is HARDEST? Or EASIEST?
  // Request implies score. Usually 100 = Perfect/Easy, but "Difficulty Score" usually implies higher = harder.
  // Let's do Difficulty Score: 0 (Beginner) to 100 (Native/Impossible)
  const overallScore = Math.min(100, Math.round((avgWeight / 8) * 100));

  let grade = 'F';
  let recommendation = '';

  if (overallScore < 20) { grade = 'A'; recommendation = 'Sangat Mudah (N5 level). Cocok untuk pemula.'; }
  else if (overallScore < 40) { grade = 'B'; recommendation = 'Mudah (N4 level). Cocok untuk latihan dasar.'; }
  else if (overallScore < 60) { grade = 'C'; recommendation = 'Menengah (N3 level). Anime standar.'; }
  else if (overallScore < 80) { grade = 'D'; recommendation = 'Sulit (N2 level). Bahasa kompleks.'; }
  else { grade = 'E'; recommendation = 'Sangat Sulit (N1+). Banyak kosakata jarang.'; }

  return {
    stats: {
      totalWords,
      uniqueWords: uniqueWords.length,
      coverage: Math.round((coveredWords / uniqueWords.length) * 100),
      jlptDistribution: jlptDist,
      bccwjDistribution: bccwjDist,
      overallScore,
      grade,
      recommendation
    },
    allWords
  };
};
