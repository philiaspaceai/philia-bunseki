export interface ParsedSubtitle {
  fileName: string;
  rawText: string;
  cleanText: string;
}

export interface TokenizedWord {
  surface: string;
  dictionaryForm: string;
  reading: string;
  partOfSpeech: string[];
}

export interface JLPTRow {
  word: string;
  reading: string;
  tags: number; // 1=N1, 5=N5
}

export interface BCCWJRow {
  id: number;
  word: string;
  reading: string;
}

export interface WordAnalysis {
  word: string;
  reading?: string;
  count: number;
  jlptLevel: number | null; // 1-5, null if unknown
  bccwjId: number | null;
  bccwjLevel: BCCWJLevel;
}

export type BCCWJLevel = 'Beginner' | 'Elementary' | 'Intermediate' | 'Advanced' | 'Expert' | 'Unknown';

export interface AnalysisResult {
  id: string; // uuid
  fileName: string;
  title: string; // derived from filename or user input
  timestamp: number;
  totalWords: number; // Token count (with duplicates)
  uniqueWords: number;
  coverage: number; // % found in DB
  
  // Stats
  jlptStats: Record<string, { count: number; percentage: number }>;
  bccwjStats: Record<string, { count: number; percentage: number }>;
  
  // Conclusions
  jlptConclusion: string;
  bccwjConclusion: string;
  overallScore: number; // 0-100
  recommendation: string;

  // Data
  wordList: WordAnalysis[];
}

export interface HistoryItem {
  id: string;
  fileName: string;
  timestamp: number;
  jlptConclusion: string;
  bccwjConclusion: string;
  overallScore: number;
}