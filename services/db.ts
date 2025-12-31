import { openDB, DBSchema } from 'idb';
import { AnalysisResult, HistoryItem } from '../types';

interface PhiliaDB extends DBSchema {
  analyses: {
    key: string;
    value: AnalysisResult;
    indexes: { 'by-date': number };
  };
}

const DB_NAME = 'philia-bunseki-db';
const STORE_NAME = 'analyses';

const dbPromise = openDB<PhiliaDB>(DB_NAME, 1, {
  upgrade(db) {
    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    store.createIndex('by-date', 'timestamp');
  },
});

export const saveAnalysis = async (analysis: AnalysisResult) => {
  const db = await dbPromise;
  await db.put(STORE_NAME, analysis);
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  const db = await dbPromise;
  const all = await db.getAllFromIndex(STORE_NAME, 'by-date');
  // Return simplified objects for list view, reverse chronological
  return all.reverse().map(item => ({
    id: item.id,
    fileName: item.fileName,
    timestamp: item.timestamp,
    jlptConclusion: item.jlptConclusion,
    bccwjConclusion: item.bccwjConclusion,
    overallScore: item.overallScore
  }));
};

export const getAnalysisById = async (id: string): Promise<AnalysisResult | undefined> => {
  const db = await dbPromise;
  return db.get(STORE_NAME, id);
};

export const deleteAnalysis = async (id: string) => {
  const db = await dbPromise;
  await db.delete(STORE_NAME, id);
};