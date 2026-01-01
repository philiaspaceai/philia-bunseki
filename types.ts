export interface WordEntry {
  id: number; // BCCWJ Rank
  word: string;
  reading: string;
  jlpt?: number;
  count: number; // Occurrence count in text
}

export interface AnalysisResult {
  id: string; // Unique ID for history
  animeName: string;
  timestamp: number;
  totalWords: number;
  avgSentenceLength: number;
  difficultyScore: number;
  jlptDistribution: {
    n1: number;
    n2: number;
    n3: number;
    n4: number;
    n5: number;
  };
  freqDistribution: {
    top1k: number;
    top5k: number;
    top10k: number;
    top20k: number;
    rare: number;
  };
  difficultWords: WordEntry[]; // Top 20 most difficult
}

export interface SubtitleLine {
  text: string;
}

export type Theme = 'light' | 'dark';

export interface ComparisonData {
  results: AnalysisResult[];
}