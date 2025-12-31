
import { Token } from '../types';
import { logger } from './logger';

declare global {
  interface Window {
    kuromoji: any;
    __SW_STATUS__?: 'ACTIVE' | 'FAILED' | 'PENDING';
  }
}

let tokenizerInstance: any = null;

// Daftar CDN cadangan jika satu diblokir sandbox
const CDN_OPTIONS = [
  'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/',
  'https://unpkg.com/kuromoji@0.1.2/dict/',
  'https://raw.githubusercontent.com/takuyaa/kuromoji.js/master/dict/'
];

async function getDictionaryPath(): Promise<string> {
  // Gunakan kamus lokal jika Service Worker berhasil (Terbaik untuk Vercel)
  if (window.__SW_STATUS__ === 'ACTIVE' && navigator.serviceWorker.controller) {
    logger.log('Mode Optimal: Menggunakan Kamus Lokal.', 'success');
    return 'dict/'; 
  }

  // Jika di Sandbox, beri tahu user
  if (window.location.hostname.includes('usercontent.goog')) {
    logger.log('Berjalan di Sandbox Preview. Mencoba akses CDN...', 'info');
  }

  return CDN_OPTIONS[0];
}

export async function initializeTokenizer(): Promise<void> {
  if (tokenizerInstance) return;

  const tryBuild = (dicPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!window.kuromoji) {
        return reject(new Error('Library Kuromoji.js gagal dimuat.'));
      }

      logger.log(`Mencoba memuat database dari: ${dicPath}`);
      const builder = window.kuromoji.builder({ dicPath });
      
      const timeoutId = setTimeout(() => {
        reject(new Error('Koneksi CDN lambat/timeout.'));
      }, 30000);

      builder.build((err: any, tokenizer: any) => {
        clearTimeout(timeoutId);
        if (err) {
          reject(err);
        } else {
          tokenizerInstance = tokenizer;
          logger.log('Tokenizer siap digunakan!', 'success');
          resolve();
        }
      });
    });
  };

  const dicPath = await getDictionaryPath();
  try {
    await tryBuild(dicPath);
  } catch (error: any) {
    logger.log(`Gagal memuat dari ${dicPath}. Mencoba CDN cadangan...`, 'warn');
    
    // Fallback ke unpkg jika jsdelivr gagal di sandbox
    try {
      await tryBuild(CDN_OPTIONS[1]);
    } catch (finalErr) {
      const isSandbox = window.location.hostname.includes('usercontent.goog');
      let msg = 'Gagal inisialisasi kamus.';
      if (isSandbox) {
        msg = 'Preview Terbatas: Sandbox Google memblokir akses database kamus. Silakan DEPLOY ke Vercel agar aplikasi berjalan normal.';
      }
      logger.log(msg, 'error');
      throw new Error(msg);
    }
  }
}

export function tokenize(text: string): Token[] {
  if (!tokenizerInstance) {
    throw new Error('Tokenizer belum siap.');
  }
  return tokenizerInstance.tokenize(text);
}
