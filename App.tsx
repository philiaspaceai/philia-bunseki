import React, { useEffect, useState } from 'react';
import { checkDictionaryExists, downloadDictionary } from './services/dictionary';
import { initializeTokenizer } from './services/tokenizer';
import { processFiles } from './services/parser';
import { analyzeText } from './services/analyzer';
import { logger } from './services/logger';
import LoadingScreen from './components/LoadingScreen';
import Dashboard from './components/Dashboard';
import { DictionaryProgress, AnalysisStats, WordAnalysis } from './types';
import { UploadCloud, FileText } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'INIT' | 'READY' | 'ANALYZING' | 'RESULTS'>('INIT');
  const [dictProgress, setDictProgress] = useState<DictionaryProgress>({
    total: 12, current: 0, filename: '', isComplete: false
  });
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<{stats: AnalysisStats, wordList: WordAnalysis[]} | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      logger.log('Memulai Philia Bunseki...');
      try {
        // 1. Cek Kamus (Hanya informatif jika SW gagal, tapi bagus untuk dimiliki)
        const hasDict = await checkDictionaryExists();
        if (!hasDict) {
          logger.log('Mengunduh aset kamus untuk penggunaan masa depan...');
          // Kita tidak perlu menunggu ini selesai jika SW gagal, tapi biarkan saja berjalan di background
          downloadDictionary(setDictProgress).catch(() => {
            logger.log('Gagal menyimpan kamus ke DB lokal, tapi tetap melanjutkan via CDN.', 'warn');
          });
        } else {
          setDictProgress({ total: 12, current: 12, filename: 'Done', isComplete: true });
        }
        
        // 2. Inisialisasi Tokenizer (Ini akan otomatis pakai CDN jika SW gagal)
        await initializeTokenizer();
        
        setAppState('READY');
      } catch (e: any) {
        const msg = e.message || "Gagal memuat sistem analisis.";
        logger.log(`Error Fatal: ${msg}`, 'error');
        setInitError(msg);
      }
    };

    initApp();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      logger.log(`${e.target.files.length} file dipilih.`);
    }
  };

  const startAnalysis = async () => {
    if (files.length === 0) return;
    logger.log('Memulai analisis linguistik...');
    setAppState('ANALYZING');
    
    setTimeout(async () => {
      try {
        const { text } = await processFiles(files);
        const result = await analyzeText(text);
        setResults(result);
        setAppState('RESULTS');
      } catch (e: any) {
        logger.log(`Kesalahan Analisis: ${e.message}`, 'error');
        setAppState('READY');
        alert("Gagal menganalisis file. Pastikan format subtitle benar.");
      }
    }, 100);
  };

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
         <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Sistem Terhenti</h1>
            <p className="text-slate-300 mb-6">{initError}</p>
            <div className="flex flex-col space-y-4">
              <button onClick={() => window.location.reload()} className="bg-indigo-600 px-6 py-2 rounded-lg font-medium hover:bg-indigo-500 transition-colors">
                Muat Ulang
              </button>
              <button onClick={() => logger.downloadLogs()} className="text-xs text-slate-500 hover:text-slate-300 underline">
                Unduh Log Kesalahan
              </button>
            </div>
         </div>
      </div>
    );
  }

  if (appState === 'INIT') {
    return <LoadingScreen progress={dictProgress} />;
  }

  if (appState === 'RESULTS' && results) {
    return <Dashboard stats={results.stats} wordList={results.wordList} reset={() => {
      setFiles([]);
      setResults(null);
      setAppState('READY');
    }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full rounded-3xl shadow-xl p-12 text-center border border-slate-100 transition-all hover:shadow-2xl">
        <div className="mb-8">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform transition-transform hover:rotate-12">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2 font-display">Philia Bunseki</h1>
          <p className="text-slate-500 italic">"Menganalisis kerumitan bahasa di balik setiap dialog anime."</p>
        </div>

        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 hover:bg-slate-50 hover:border-indigo-300 transition-all cursor-pointer relative group">
          <input type="file" multiple accept=".srt" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          {files.length === 0 ? (
            <div className="space-y-3">
              <span className="text-indigo-600 font-bold group-hover:scale-105 inline-block transition-transform">Pilih File Subtitle (.srt)</span>
              <p className="text-xs text-slate-400">Seret file ke sini untuk memulai</p>
            </div>
          ) : (
            <div className="space-y-2">
              <FileText className="w-8 h-8 text-indigo-400 mx-auto animate-bounce" />
              <p className="font-bold text-slate-700">{files.length} File Siap</p>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto truncate text-center">
                {files.map(f => f.name).join(', ')}
              </p>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <button 
            onClick={startAnalysis}
            className={`mt-10 w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${
              appState === 'ANALYZING' 
                ? 'bg-slate-400 cursor-wait' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/40'
            }`}
            disabled={appState === 'ANALYZING'}
          >
            {appState === 'ANALYZING' ? 'Menganalisis...' : 'Analisis Tingkat Kesulitan'}
          </button>
        )}
      </div>
      
      <div className="mt-8 text-center text-[11px] text-slate-400 space-y-1">
        <p>Philia Bunseki v1.1 | PWA & Offline-ready</p>
        <button onClick={() => logger.downloadLogs()} className="text-slate-300 hover:text-indigo-400 transition-colors">
          Buka Debug Log
        </button>
      </div>
    </div>
  );
};

export default App;