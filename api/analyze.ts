
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { AnalysisResult, WordStats, JlptWord, BccwjWord } from '../types';
import { Tokenizer, Dictionary } from 'sudachi-js';

// Inisialisasi Supabase di sisi server
const supabaseUrl = 'https://xxnsvylzzkgcnubaegyv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bnN2eWx6emtnY251YmFlZ3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDE0MjcsImV4cCI6MjA3OTk3NzQyN30.x0wz0v_qqvg6riMipKMr3IM30YnGaGs1b9uMvJRGG5M';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Inisialisasi tokenizer di luar handler untuk digunakan kembali di seluruh invokasi
let tokenizer: Tokenizer | null = null;
try {
    const dictionary = new Dictionary();
    tokenizer = dictionary.create();
    console.log("Sudachi tokenizer initialized successfully.");
} catch (e) {
    console.error("Failed to initialize Sudachi tokenizer", e);
}

const CHUNK_SIZE = 50;

const queryDatabaseInChunks = async <T,>(table: string, column: string, select: string, values: string[]): Promise<T[]> => {
    const results: T[] = [];
    for (let i = 0; i < values.length; i += CHUNK_SIZE) {
        const chunk = values.slice(i, i + CHUNK_SIZE);
        const { data, error } = await supabase
            .from(table)
            .select(select)
            .in(column, chunk);

        if (error) {
            console.error(`Error querying ${table}:`, error);
            throw new Error(`Gagal mengambil data dari tabel ${table}. Pesan: ${error.message}`);
        }
        if (data) {
            results.push(...(data as T[]));
        }
    }
    return results;
};

const calculateResults = (allTokens: string[], jlptData: JlptWord[], bccwjData: BccwjWord[]): AnalysisResult => {
    const jlptMap = new Map<string, string>();
    jlptData.forEach(item => jlptMap.set(item.word, item.tags));

    const bccwjMap = new Map<string, number>();
    bccwjData.forEach(item => bccwjMap.set(item.word, item.id));

    const stats: WordStats = {
        totalWords: allTokens.length,
        uniqueWords: new Set(allTokens).size,
        jlptDistribution: { N1: 0, N2: 0, N3: 0, N4: 0, N5: 0, Unknown: 0 },
        jlptWordLists: { N1: [], N2: [], N3: [], N4: [], N5: [], Unknown: [] },
        averageFrequencyRank: 0,
        wordsByFrequency: []
    };

    let totalRank = 0;
    let wordsWithRank = 0;

    const uniqueTokens = Array.from(new Set(allTokens));

    uniqueTokens.forEach(token => {
        const jlptLevel = jlptMap.get(token);
        const bccwjRank = bccwjMap.get(token);

        if (jlptLevel) {
            const levelKey = `N${jlptLevel}` as keyof typeof stats.jlptDistribution;
            if (stats.jlptDistribution.hasOwnProperty(levelKey)) {
                stats.jlptDistribution[levelKey]++;
                stats.jlptWordLists[levelKey].push(token);
            }
        } else {
            stats.jlptDistribution.Unknown++;
            stats.jlptWordLists.Unknown.push(token);
        }

        if (bccwjRank) {
            totalRank += bccwjRank;
            wordsWithRank++;
            stats.wordsByFrequency.push({ word: token, rank: bccwjRank });
        }
    });
    
    stats.averageFrequencyRank = wordsWithRank > 0 ? Math.round(totalRank / wordsWithRank) : 0;
    stats.wordsByFrequency.sort((a, b) => a.rank - b.rank);

    let score = 0;
    const { N5, N4, N3, N2, N1 } = stats.jlptDistribution;
    const knownWords = N1 + N2 + N3 + N4 + N5;
    if (knownWords === 0) {
        return { stats, predictedLevel: { level: "Tidak dapat ditentukan", description: "Kosakata yang diketahui tidak cukup untuk menentukan level." } };
    }

    score += N5 * 1;
    score += N4 * 2;
    score += N3 * 3.5;
    score += N2 * 5;
    score += N1 * 7;
    
    const weightedAverage = score / knownWords;
    
    let predictedLevel = { level: "Pemula (N5)", description: "Kosakata sebagian besar terdiri dari kata-kata yang sangat dasar, cocok untuk pemula absolut." };
    if (weightedAverage > 4.5) {
        predictedLevel = { level: "Mahir (N1)", description: "Mengandung banyak kosakata yang sangat canggih dan terspesialisasi. Cocok untuk pembelajar tingkat mahir." };
    } else if (weightedAverage > 3.2) {
        predictedLevel = { level: "Menengah Atas (N2)", description: "Membutuhkan pemahaman bahasa Jepang yang kuat, dengan banyak kata yang kompleks dan bernuansa." };
    } else if (weightedAverage > 2.2) {
        predictedLevel = { level: "Menengah (N3)", description: "Campuran yang baik antara bahasa sehari-hari dan kosakata yang lebih spesifik. Ideal untuk pembelajar tingkat menengah." };
    } else if (weightedAverage > 1.5) {
        predictedLevel = { level: "Pemula Bawah (N4)", description: "Menggunakan kosakata dasar yang umum di luar dasar-dasar absolut. Langkah yang bagus untuk pemula." };
    }
    
    return { stats, predictedLevel };
};


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    if (!tokenizer) {
        return res.status(500).json({ error: 'Tokenizer tidak tersedia.' });
    }

    try {
        console.log("Received request body:", JSON.stringify(req.body, null, 2));

        if (!req.body || typeof req.body !== 'object' || !('text' in req.body)) {
            return res.status(400).json({ error: "Request body harus berupa objek JSON dengan properti 'text'." });
        }

        const { text } = req.body;

        if (typeof text !== 'string' || text.trim() === '') {
             return res.status(400).json({ error: "Properti 'text' harus berupa string dan tidak boleh kosong." });
        }

        const tokens = tokenizer.tokenize(text);
        
        const allTokens: string[] = tokens
            .filter(token => {
                const partOfSpeech = token.getPartOfSpeech()[0];
                return ['名詞', '動詞', '形容詞', '副詞'].includes(partOfSpeech);
            })
            .map(token => token.getDictionaryForm());

        const uniqueTokens = Array.from(new Set(allTokens));

        const jlptData = await queryDatabaseInChunks<JlptWord>('jlpt', 'word', 'word,tags', uniqueTokens);
        const bccwjData = await queryDatabaseInChunks<BccwjWord>('bccwj', 'word', 'word,id', uniqueTokens);
        
        const results = calculateResults(allTokens, jlptData, bccwjData);

        return res.status(200).json(results);

    } catch (error) {
        console.error('Server error in /api/analyze:', error);
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
        return res.status(500).json({ error: errorMessage });
    }
}
