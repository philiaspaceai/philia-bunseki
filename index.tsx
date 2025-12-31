
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { logger } from './services/logger';

// Inisialisasi status
(window as any).__SW_STATUS__ = 'PENDING';

const registerSW = () => {
  if ('serviceWorker' in navigator) {
    // Di lingkungan preview, sw.js seringkali tidak bisa diakses lintas origin
    navigator.serviceWorker.register('sw.js').then(
      (registration) => {
        logger.log(`ServiceWorker aktif: ${registration.scope}`, 'success');
        (window as any).__SW_STATUS__ = 'ACTIVE';
      },
      (err) => {
        logger.log(`SW non-aktif (Preview Mode): ${err.message}`, 'warn');
        (window as any).__SW_STATUS__ = 'FAILED';
      }
    );
  } else {
    (window as any).__SW_STATUS__ = 'FAILED';
  }
};

if (document.readyState === 'complete') {
  registerSW();
} else {
  window.addEventListener('load', registerSW);
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
