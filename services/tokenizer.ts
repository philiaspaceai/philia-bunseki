import { Token } from '../types';

declare global {
  interface Window {
    kuromoji: any;
  }
}

let tokenizerInstance: any = null;

async function waitForServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  
  // Pastikan SW benar-benar mengontrol halaman ini
  if (navigator.serviceWorker.controller) {
    console.log("SW already controlling");
    return;
  }

  console.log("Waiting for SW controller...");
  return new Promise<void>((resolve) => {
    const onControllerChange = () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        console.log("SW control acquired!");
        resolve();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    
    // Safety timeout: jika dalam 6 detik tidak ada controllerchange, 
    // coba paksa klaim atau lanjut saja (mungkin gagal tapi tidak hang)
    setTimeout(() => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      resolve();
    }, 6000);
  });
}

export async function initializeTokenizer(): Promise<void> {
  if (tokenizerInstance) return;

  console.log("Initializing Tokenizer...");
  await waitForServiceWorker();

  return new Promise((resolve, reject) => {
    if (!window.kuromoji) {
      return reject(new Error('Kuromoji library missing from global scope.'));
    }

    const builder = window.kuromoji.builder({ dicPath: '/dict/' });
    
    const buildTimeout = setTimeout(() => {
      reject(new Error('Kamus hang saat inisialisasi. Pastikan koneksi stabil dan Service Worker aktif.'));
    }, 25000);

    builder.build((err: any, tokenizer: any) => {
      clearTimeout(buildTimeout);
      if (err) {
        console.error('Kuromoji build error:', err);
        reject(new Error('Kamus gagal dimuat. Error: ' + (err.message || 'Network/DB Error')));
      } else {
        tokenizerInstance = tokenizer;
        console.log("Tokenizer ready!");
        resolve();
      }
    });
  });
}

export function tokenize(text: string): Token[] {
  if (!tokenizerInstance) {
    throw new Error('Tokenizer belum siap.');
  }
  return tokenizerInstance.tokenize(text);
}