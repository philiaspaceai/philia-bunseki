import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { AnalysisResult, WordStats, JlptWord, BccwjWord } from '../types';
import kuromoji from 'kuromoji';
import path from 'path';
import fs from 'fs';

// Inisialisasi Supabase
const supabaseUrl = 'https://xxnsvylzzkgcnubaegyv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bnN2eWx6emtnY251YmFlZ3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDE0MjcsImV4cCI6MjA3OTk3NzQyN30.x0wz0v_qqvg6riMipKMr3IM30YnGaGs1b9uMvJRGG5M';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cache tokenizer di memori serverless function
let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null;

const getTokenizer = async (): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> => {
    if (tokenizer) return tokenizer;

    return new Promise((resolve, reject) => {
        // Fix for TS errors: process.cwd() not on type 'Process' and __dirname missing in ESM/Vite context
        const cwd = (process as any).cwd();

        // Coba beberapa kemungkinan path untuk kamus
        const possiblePaths = [
            path.join(cwd, 'node_modules', 'kuromoji', 'dict'),
            // Fallback replacements for __dirname logic
            path.join(cwd, '..', 'node_modules', 'kuromoji', 'dict'), 
            path.join(cwd, 'api', 'node_modules', 'kuromoji', 'dict'), 
            path.join(cwd, 'dict') // Fallback khusus Vercel
        ];

        let dicPath = '';
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                dicPath = p;
                console.log(`[DEBUG] Dictionary found at: ${dicPath}`);
                break;
            }
        }

        if (!dicPath) {
             console.error(`[ERROR] Dictionary not found. Checked: ${possiblePaths.join(', ')}`);
             console.error(`[DEBUG] CWD: ${cwd}`);
             try {
                console.error(`[DEBUG] Root listing: ${fs.readdirSync(cwd).join(', ')}`);
             } catch (e) { /* ignore */ }
             return reject(new Error("Dictionary directory not found"));
        }
        
        kuromoji.builder({ dicPath })
            .build((err, _tokenizer) => {
                if (err) {
                    console.error("Kuromoji build error:", err);
                    reject(err);
                } else {
                    tokenizer = _tokenizer;
                    resolve(_tokenizer);
                }
            });
    });
};

const CHUNK_SIZE = 50;

const queryDatabaseInChunks = async <T,>(table: string, column: string, select: string, values: string[]): Promise<T[]> => {
    const results: T[] = [];
    const uniqueValues = Array.from(new Set(values));
    
    for (let i = 0; i < uniqueValues.length; i += CHUNK_SIZE) {
        const chunk = uniqueValues.slice(i, i + CHUNK_SIZE);
        const { data, error } = await supabase
            .from(table)
            .select(select)
            .in(column, chunk);

        if (error) {
            console.error(`Error querying ${table}:`, error);
            continue; 
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
    
    let predictedLevel = { level: "Pemula (N5)", description: "Kosakata sebagian besar terdiri dari kata-kata yang sangat dasar." };
    if (weightedAverage > 4.5) {
        predictedLevel = { level: "Mahir (N1)", description: "Mengandung banyak kosakata canggih dan abstrak." };
    } else if (weightedAverage > 3.2) {
        predictedLevel = { level: "Menengah Atas (N2)", description: "Bahasa Jepang tingkat lanjut dengan variasi nuansa." };
    } else if (weightedAverage > 2.2) {
        predictedLevel = { level: "Menengah (N3)", description: "Bahasa sehari-hari normal dengan sedikit istilah teknis." };
    } else if (weightedAverage > 1.5) {
        predictedLevel = { level: "Pemula Bawah (N4)", description: "Kosakata dasar sehari-hari." };
    }
    
    return { stats, predictedLevel };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        if (!req.body || typeof req.body !== 'object' || !('text' in req.body)) {
            return res.status(400).json({ error: "Body harus JSON dengan properti 'text'." });
        }

        const { text } = req.body;
        if (typeof text !== 'string' || text.trim() === '') {
             return res.status(400).json({ error: "Teks tidak boleh kosong." });
        }

        const tokenizerInstance = await getTokenizer();
        const tokens = tokenizerInstance.tokenize(text);
        
        const allowedPos = ['名詞', '動詞', '形容詞', '副詞'];
        
        const allTokens: string[] = tokens
            .filter(token => allowedPos.includes(token.pos))
            .map(token => {
                return (token.basic_form && token.basic_form !== '*') ? token.basic_form : token.surface_form;
            })
            .filter(word => word.length > 0 && !/^[\u3000-\u303F]+$/.test(word));

        const jlptData = await queryDatabaseInChunks<JlptWord>('jlpt', 'word', 'word,tags', allTokens);
        const bccwjData = await queryDatabaseInChunks<BccwjWord>('bccwj', 'word', 'word,id', allTokens);
        
        const results = calculateResults(allTokens, jlptData, bccwjData);

        return res.status(200).json(results);

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal Server Error' });
    }
}