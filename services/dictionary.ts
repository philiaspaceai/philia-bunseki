
import { DictionaryProgress } from '../types';
import { logger } from './logger';

const DB_NAME = 'kuromoji-dict';
const STORE_NAME = 'files';
const DB_VERSION = 1;
const CDN_URL = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/';

const FILES = [
  'base.dat.gz', 'cc.dat.gz', 'check.dat.gz', 'tid.dat.gz',
  'tid_map.dat.gz', 'tid_pos.dat.gz', 'unk.dat.gz', 'unk_char.dat.gz',
  'unk_compat.dat.gz', 'unk_invoke.dat.gz', 'unk_map.dat.gz', 'unk_pos.dat.gz'
];

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

export async function checkDictionaryExists(): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();
      req.onsuccess = () => {
        const count = req.result;
        db.close();
        resolve(count === FILES.length);
      };
      req.onerror = () => { db.close(); resolve(false); };
    });
  } catch { return false; }
}

export async function downloadDictionary(
  onProgress: (progress: DictionaryProgress) => void
): Promise<void> {
  let db: IDBDatabase | null = null;
  try {
    db = await openDB();
    for (let i = 0; i < FILES.length; i++) {
      const filename = FILES[i];
      onProgress({ total: FILES.length, current: i + 1, filename, isComplete: false });
      
      const response = await fetch(`${CDN_URL}${filename}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();

      await new Promise<void>((resolve, reject) => {
        if (!db) return reject();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(blob, filename);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
    onProgress({ total: FILES.length, current: FILES.length, filename: 'Done', isComplete: true });
  } catch (err: any) {
    logger.log(`Gagal menyimpan kamus offline: ${err.message}`, 'warn');
  } finally {
    if (db) db.close();
  }
}
