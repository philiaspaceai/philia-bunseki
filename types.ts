export interface Token {
  surface: string;
  dictionaryForm: string;
  reading?: string;
  partOfSpeech?: string[];
}

export type JLPTLevel = 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'Unknown';

export type BCCWJLevel = 'Beginner' | 'Elementary' | 'Intermediate' | 'Advanced' | 'Expert' | 'Unknown';

export interface WordData {
  word: string;
  reading: string;
  jlpt: JLPTLevel;
  bccwj: BCCWJLevel;
  frequency_rank?: number;
  count: number;
}

export interface Statistics {
  totalWords: number;
  uniqueWords: number;
  coverage: number; // percentage
  jlptDistribution: Record<JLPTLevel, { count: number; percentage: number }>;
  bccwjDistribution: Record<BCCWJLevel, { count: number; percentage: number }>;
  overallScore: number; // 0-100
  grade: string; // A, B, C...
  recommendation: string;
}

export interface AnalysisResult {
  id?: number; // IndexedDB ID
  title: string;
  fileName: string;
  timestamp: number;
  stats: Statistics;
  topWords: WordData[];
  hardWords: WordData[];
  allWords: WordData[]; // Usually simplified for storage
}

// Database schema types
export interface DB_JLPT {
  word: string;
  reading: string;
  tags: number; // 1-5
}

export interface DB_BCCWJ {
  id: number;
  word: string;
  reading: string;
}
