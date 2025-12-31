import { DictionaryProgress } from '../types';

const DB_NAME = 'kuromoji-dict';
const STORE_NAME = 'files';
const DB_VERSION = 1;
const CDN_URL = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/';

const FILES = [
  'base.dat.gz',
  'cc.dat.gz',
  'check.dat.gz',
  'tid.dat.gz',
  'tid_map.dat.gz',
  'tid_pos.dat.gz',
  'unk.dat.gz',
  'unk_char.dat.gz',
  'unk_compat.dat.gz',
  'unk_invoke.dat.gz',
  'unk_map.dat.gz',
  'unk_pos.dat.gz'
];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
}

export async function checkDictionaryExists(): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.count();
      request.onsuccess = () => {
        const count = request.result;
        db.close(); // Penting: Tutup DB
        resolve(count === FILES.length); 
      };
      request.onerror = () => {
        db.close();
        resolve(false);
      };
    });
  } catch (e) {
    return false;
  }
}

export async function downloadDictionary(
  onProgress: (progress: DictionaryProgress) => void
): Promise<void> {
  const db = await openDB();

  for (let i = 0; i < FILES.length; i++) {
    const filename = FILES[i];
    onProgress({
      total: FILES.length,
      current: i + 1,
      filename,
      isComplete: false
    });

    try {
      const response = await fetch(`${CDN_URL}${filename}`);
      if (!response.ok) throw new Error(`Failed to fetch ${filename}`);
      const blob = await response.blob();

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(blob, filename);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

    } catch (error: any) {
      db.close();
      onProgress({
        total: FILES.length,
        current: i + 1,
        filename,
        isComplete: false,
        error: error.message
      });
      throw error;
    }
  }

  db.close(); // Tutup setelah semua selesai
  onProgress({
    total: FILES.length,
    current: FILES.length,
    filename: 'Done',
    isComplete: true
  });
}