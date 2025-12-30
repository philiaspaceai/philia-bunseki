
export type AppStatus = 'idle' | 'analyzing' | 'success' | 'error';

export interface JlptWord {
    word: string;
    tags: string; // JLPT level as a string '1', '2', '3', '4', '5'
}

export interface BccwjWord {
    word: string;
    id: number; // Frequency rank
}

export interface WordStats {
    totalWords: number;
    uniqueWords: number;
    jlptDistribution: {
        N1: number;
        N2: number;
        N3: number;
        N4: number;
        N5: number;
        Unknown: number;
    };
    jlptWordLists: {
        N1: string[];
        N2: string[];
        N3: string[];
        N4: string[];
        N5: string[];
        Unknown: string[];
    };
    averageFrequencyRank: number;
    wordsByFrequency: { word: string; rank: number }[];
}

export interface AnalysisResult {
    stats: WordStats;
    predictedLevel: {
        level: string;
        description: string;
    };
}
