import React, { useEffect, useState } from 'react';
import { checkDictionaryExists, downloadDictionary } from './services/dictionary';
import { initializeTokenizer } from './services/tokenizer';
import { processFiles } from './services/parser';
import { analyzeText } from './services/analyzer';
import LoadingScreen from './components/LoadingScreen';
import Dashboard from './components/Dashboard';
import { DictionaryProgress, AnalysisStats, WordAnalysis } from './types';
import { UploadCloud, FileText } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'INIT' | 'READY' | 'ANALYZING' | 'RESULTS'>('INIT');
  const [dictProgress, setDictProgress] = useState<DictionaryProgress>({
    total: 0, current: 0, filename: '', isComplete: false
  });
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<{stats: AnalysisStats, wordList: WordAnalysis[]} | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Cek Kamus
        const hasDict = await checkDictionaryExists();
        if (!hasDict) {
          await downloadDictionary(setDictProgress);
        }
        
        // Update UI ke state Finalizing
        setDictProgress({ 
          total: 12, 
          current: 12, 
          filename: 'Done', 
          isComplete: true 
        });

        // Beri sedikit nafas untuk browser memproses Service Worker & IDB
        await new Promise(r => setTimeout(r, 500));
        
        // 2. Inisialisasi Tokenizer (dengan SW wait)
        await initializeTokenizer();
        
        setAppState('READY');
      } catch (e: any) {
        console.error("Initialization failed", e);
        setInitError(e.message || "Gagal memuat sistem.");
      }
    };

    initApp();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const startAnalysis = async () => {
    if (files.length === 0) return;
    setAppState('ANALYZING');
    
    setTimeout(async () => {
      try {
        const { text } = await processFiles(files);
        const result = await analyzeText(text);
        setResults(result);
        setAppState('RESULTS');
      } catch (e) {
        console.error("Analysis error", e);
        setAppState('READY');
        alert("Terjadi kesalahan saat menganalisis file.");
      }
    }, 100);
  };

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-6">
         <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Gagal Inisialisasi</h1>
            <p className="text-slate-300 mb-6">{initError}</p>
            <button 
              onClick={() => {
                // Bersihkan cache dan reload jika error parah
                window.location.reload();
              }} 
              className="bg-indigo-600 px-6 py-2 rounded-lg font-medium hover:bg-indigo-500"
            >
              Coba Lagi
            </button>
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
      <div className="bg-white max-w-2xl w-full rounded-3xl shadow-xl p-12 text-center border border-slate-100">
        <div className="mb-8">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Anime Subtitle Analyzer</h1>
          <p className="text-slate-500">Unggah file .srt untuk menganalisis tingkat kesulitan kosa kata</p>
        </div>

        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:bg-slate-50 hover:border-indigo-300 transition-all cursor-pointer relative group">
          <input 
            type="file" 
            multiple 
            accept=".srt" 
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {files.length === 0 ? (
            <div className="space-y-2">
              <span className="text-indigo-600 font-semibold group-hover:text-indigo-700">Klik untuk unggah</span>
              <p className="text-sm text-slate-400">atau tarik dan lepas file .srt di sini</p>
            </div>
          ) : (
            <div className="space-y-2">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-medium text-slate-700">{files.length} file dipilih</p>
              <p className="text-xs text-slate-400">{files.map(f => f.name).join(', ')}</p>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <button 
            onClick={startAnalysis}
            className={`mt-8 w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
              appState === 'ANALYZING' 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30'
            }`}
            disabled={appState === 'ANALYZING'}
          >
            {appState === 'ANALYZING' ? 'Memproses...' : 'Mulai Analisis'}
          </button>
        )}
        
        {appState === 'ANALYZING' && (
           <div className="mt-4 text-sm text-slate-400 animate-pulse">
             Sedang memecah kosa kata dan mencocokkan database...
           </div>
        )}
      </div>
      
      <div className="mt-8 text-center text-xs text-slate-400">
        <p>Philia Bunseki &copy; 2025. Kamus disimpan secara lokal di browser.</p>
      </div>
    </div>
  );
};

export default App;