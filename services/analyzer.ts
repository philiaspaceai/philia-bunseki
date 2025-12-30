
import { supabase } from '../lib/supabaseClient';
import { parseSrt } from './srtParser';
import type { AnalysisResult, WordStats, JlptWord, BccwjWord } from '../types';
import { logger } from './logger';

// Client-side fallback for Japanese tokenization.
// This is a simplified approach. A proper backend with SudachiJS is recommended.
const simpleTokenize = (text: string): string[] => {
    // Regex to match sequences of Hiragana, Katakana, and Kanji characters.
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g;
    const matches = text.match(japaneseRegex);
    return matches || [];
};

const CHUNK_SIZE = 500; // Process 500 unique words per Supabase request to stay within limits.

const queryDatabaseInChunks = async <T,>(table: string, column: string, select: string, values: string[]): Promise<T[]> => {
    const results: T[] = [];
    logger.log(`Memulai query ke tabel '${table}' dengan ${values.length} item, ukuran chunk: ${CHUNK_SIZE}.`);
    for (let i = 0; i < values.length; i += CHUNK_SIZE) {
        const chunk = values.slice(i, i + CHUNK_SIZE);
        const { data, error } = await supabase
            .from(table)
            .select(select)
            .in(column, chunk);

        if (error) {
            const errorMessage = `Gagal mengambil data dari tabel ${table}. Periksa konsol browser untuk detailnya.`;
            logger.log(`ERROR: Query ke tabel '${table}' gagal: ${error.message}`);
            console.error(`Error querying ${table}:`, error);
            throw new Error(errorMessage);
        }
        if (data) {
            results.push(...(data as T[]));
        }
        logger.log(`Chunk ${i / CHUNK_SIZE + 1} untuk tabel '${table}' berhasil diambil, ${data?.length || 0} baris diterima.`);
    }
    logger.log(`Semua query ke tabel '${table}' selesai, total ${results.length} baris diterima.`);
    return results;
};

const calculateResults = (allTokens: string[], jlptData: JlptWord[], bccwjData: BccwjWord[]): AnalysisResult => {
    logger.log('Memulai kalkulasi hasil akhir...');
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

    logger.log(`Distribusi JLPT: N1(${stats.jlptDistribution.N1}), N2(${stats.jlptDistribution.N2}), N3(${stats.jlptDistribution.N3}), N4(${stats.jlptDistribution.N4}), N5(${stats.jlptDistribution.N5}), Tidak Dikenal(${stats.jlptDistribution.Unknown}).`);
    logger.log(`Peringkat frekuensi rata-rata: ${stats.averageFrequencyRank} dari ${wordsWithRank} kata.`);

    // --- Scoring Logic ---
    let score = 0;
    const { N5, N4, N3, N2, N1 } = stats.jlptDistribution;
    const knownWords = N1 + N2 + N3 + N4 + N5;
    if (knownWords === 0) { // Avoid division by zero
        logger.log('Tidak ada kosakata yang diketahui, level tidak dapat ditentukan.');
        return { stats, predictedLevel: { level: "Tidak dapat ditentukan", description: "Kosakata yang diketahui tidak cukup untuk menentukan level." } };
    }

    score += N5 * 1;
    score += N4 * 2;
    score += N3 * 3.5;
    score += N2 * 5;
    score += N1 * 7;
    
    const weightedAverage = score / knownWords;
    logger.log(`Skor rata-rata tertimbang dihitung: ${weightedAverage.toFixed(2)}.`);
    
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
    
    logger.log(`Kalkulasi selesai. Prediksi level: ${predictedLevel.level}.`);
    return { stats, predictedLevel };
};

export const runAnalysis = async (files: File[], setProgress: (message: string) => void): Promise<AnalysisResult> => {
    if (files.length === 0) {
        throw new Error("Tidak ada file yang dipilih.");
    }

    setProgress('Membaca dan mem-parsing file subtitle...');
    logger.log('Membaca dan mem-parsing file subtitle...');
    const fileContents = await Promise.all(
        Array.from(files).map(file => file.text())
    );
    const combinedSrt = fileContents.join('\n\n');
    const cleanText = parseSrt(combinedSrt);
    logger.log(`Parsing selesai. Total karakter teks bersih: ${cleanText.length}.`);
    
    if (!cleanText) {
        throw new Error("Tidak dapat mengekstrak teks dari file yang diberikan.");
    }
    
    setProgress('Melakukan tokenisasi teks Jepang...');
    logger.log('Melakukan tokenisasi teks Jepang...');
    const allTokens = simpleTokenize(cleanText);
    const uniqueTokens = Array.from(new Set(allTokens));
    logger.log(`Tokenisasi selesai. Total token: ${allTokens.length}, Token unik: ${uniqueTokens.length}.`);

    setProgress(`Mengambil data JLPT untuk ${uniqueTokens.length} kata unik...`);
    const jlptData = await queryDatabaseInChunks<JlptWord>('jlpt', 'word', 'word,tags', uniqueTokens);

    setProgress(`Mengambil data frekuensi BCCWJ...`);
    const bccwjData = await queryDatabaseInChunks<BccwjWord>('bccwj', 'word', 'word,id', uniqueTokens);
    
    setProgress('Menghitung hasil akhir...');
    const results = calculateResults(allTokens, jlptData, bccwjData);

    return results;
};
