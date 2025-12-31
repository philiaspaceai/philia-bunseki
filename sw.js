
const CACHE_NAME = 'philia-cache-v1';
const DICT_DB_NAME = 'kuromoji-dict';
const DICT_STORE_NAME = 'files';

self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event - claiming clients');
  event.waitUntil(self.clients.claim());
});

async function getFileFromIDB(filename) {
  let targetFile = filename;
  if (filename === 'cn.dat.gz') targetFile = 'cc.dat.gz';

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DICT_DB_NAME, 1);
    
    request.onerror = () => reject('IDB_OPEN_ERROR');
    request.onsuccess = (event) => {
      const db = event.target.result;
      try {
        const tx = db.transaction(DICT_STORE_NAME, 'readonly');
        const store = tx.objectStore(DICT_STORE_NAME);
        const getReq = store.get(targetFile);
        getReq.onsuccess = () => {
          const result = getReq.result;
          db.close();
          resolve(result);
        };
        getReq.onerror = () => {
          db.close();
          reject('IDB_GET_ERROR');
        };
      } catch (e) {
        db.close();
        reject(e.message);
      }
    };
  });
}

self.addEventListener('fetch', (event) => {
  // Pastikan URL valid sebelum diproses
  let url;
  try {
    url = new URL(event.request.url);
  } catch (e) {
    // Jika URL tidak valid (misal scheme aneh), biarkan browser menangani secara default
    return;
  }

  if (url.pathname.includes('/dict/')) {
    const filename = url.pathname.split('/').pop();
    console.log(`[SW] Intercepted dict request: ${filename}`);

    event.respondWith(
      (async () => {
        try {
          const blob = await getFileFromIDB(filename);
          if (blob) {
            console.log(`[SW] Serving ${filename} from IndexedDB`);
            return new Response(blob, {
              status: 200,
              headers: { 
                'Content-Type': 'application/x-gzip',
                'Cache-Control': 'public, max-age=31536000'
              }
            });
          }
          console.error(`[SW] File ${filename} NOT FOUND in IDB`);
          return new Response('File missing in local DB', { status: 404 });
        } catch (error) {
          console.error(`[SW] Error handling ${filename}:`, error);
          return new Response('SW IDB Internal Error', { status: 500 });
        }
      })()
    );
    return;
  }

  // Cache strategy sederhana untuk aset lain
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
