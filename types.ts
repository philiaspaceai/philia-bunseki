
export interface Token {
  word_id: number;
  word_type: string;
  word_position: number;
  surface_form: string;
  pos: string;
  pos_detail_1: string;
  pos_detail_2: string;
  pos_detail_3: string;
  conjugated_type: string;
  conjugated_form: string;
  basic_form: string;
  reading?: string;
  pronunciation?: string;
}

export interface SupabaseWord {
  word: string;
  reading?: string;
  tags?: string; // e.g. "4" for N4
  id?: number; // BCCWJ rank
}

export interface WordAnalysis {
  token: Token;
  jlptLevel: number | null; // 1-5, or null
  bccwjRank: number | null;
  isUnknown: boolean;
  count: number;
  exampleSentence?: string;
}

export interface AnalysisStats {
  totalWords: number;
  uniqueWords: number;
  coverage: {
    n1: number;
    n2: number;
    n3: number;
    n4: number;
    n5: number;
    unknown: number;
  };
  bccwjDistribution: {
    veryCommon: number; // 1-1000
    common: number; // 1001-5000
    uncommon: number; // 5001-10000
    rare: number; // 10001+
    notRanked: number;
  };
  overallDifficulty: string; // "N5" - "N1"
  recommendation: string;
}

export interface DictionaryProgress {
  total: number;
  current: number;
  filename: string;
  isComplete: boolean;
  error?: string;
}

export interface SubtitleFile {
  name: string;
  size: number;
  content: string;
}

// Global interface for system-wide logging
export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'warn' | 'error' | 'success';
}
