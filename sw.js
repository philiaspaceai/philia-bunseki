const CACHE_NAME = 'philia-cache-v1';
const DICT_DB_NAME = 'kuromoji-dict';
const DICT_STORE_NAME = 'files';

// Segera ambil alih kontrol tanpa menunggu reload
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(names => Promise.all(names.map(name => caches.delete(name)))),
      self.clients.claim()
    ])
  );
});

// Helper untuk mengambil file dari IndexedDB dengan timeout dan error handling
function getFileFromIDB(filename) {
  let targetFile = filename;
  // Alias untuk kompatibilitas versi kuromoji
  if (filename === 'cn.dat.gz') targetFile = 'cc.dat.gz';

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DICT_DB_NAME, 1);
    
    // Jika timeout 3 detik gagal buka DB, reject
    const timeout = setTimeout(() => reject('IDB Timeout'), 3000);

    request.onerror = () => {
      clearTimeout(timeout);
      reject('IDB Error');
    };

    request.onsuccess = (event) => {
      clearTimeout(timeout);
      const db = event.target.result;
      try {
        const tx = db.transaction(DICT_STORE_NAME, 'readonly');
        const store = tx.objectStore(DICT_STORE_NAME);
        const getReq = store.get(targetFile);
        getReq.onsuccess = () => {
          resolve(getReq.result);
          db.close(); // Tutup koneksi setelah selesai
        };
        getReq.onerror = () => {
          reject('Get Error');
          db.close();
        };
      } catch (e) {
        reject(e);
        db.close();
      }
    };
  });
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intersep request ke path virtual kamus
  if (url.pathname.includes('/dict/')) {
    const filename = url.pathname.split('/').pop();
    if (!filename) return;

    event.respondWith(
      (async () => {
        try {
          const blob = await getFileFromIDB(filename);
          if (blob) {
            return new Response(blob, {
              status: 200,
              headers: { 
                'Content-Type': 'application/x-gzip',
                'Cache-Control': 'public, max-age=31536000'
              }
            });
          }
          // Jika tidak ada di IDB, jangan biarkan gantung, kembalikan 404 agar library bisa error & kita handle
          return new Response('File not found in IndexedDB', { status: 404 });
        } catch (error) {
          console.error('SW Error:', filename, error);
          return new Response('Service Worker IDB Error', { status: 500 });
        }
      })()
    );
    return;
  }

  // Caching standar untuk aset lain
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});