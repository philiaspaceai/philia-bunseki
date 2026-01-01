import { openDB, DBSchema } from 'idb';
import { AnalysisResult } from '../types';
import { DB_NAME, DB_STORE } from '../constants';

interface JimakuDB extends DBSchema {
  [DB_STORE]: {
    key: string;
    value: AnalysisResult;
    indexes: { 'by-date': number };
  };
}

const dbPromise = openDB<JimakuDB>(DB_NAME, 1, {
  upgrade(db) {
    const store = db.createObjectStore(DB_STORE, { keyPath: 'id' });
    store.createIndex('by-date', 'timestamp');
  },
});

export const saveResult = async (result: AnalysisResult) => {
  return (await dbPromise).put(DB_STORE, result);
};

export const getAllResults = async () => {
  return (await dbPromise).getAllFromIndex(DB_STORE, 'by-date');
};

export const deleteResult = async (id: string) => {
  return (await dbPromise).delete(DB_STORE, id);
};