import React, { useEffect, useState, useRef } from 'react';
import { DictionaryProgress, LogEntry } from '../types';
import { logger } from '../services/logger';
import { Loader2, Download, AlertTriangle } from 'lucide-react';

interface Props {
  progress: DictionaryProgress;
}

const LoadingScreen: React.FC<Props> = ({ progress }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const percent = Math.round((progress.current / progress.total) * 100) || 0;

  useEffect(() => {
    const unsubscribe = logger.subscribe(setLogs);
    return unsubscribe;
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-white z-50 overflow-hidden">
      <div className="w-full max-w-2xl px-6 flex flex-col h-full max-h-[90vh]">
        <div className="mt-8 mb-8 text-center flex-shrink-0">
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Philia Bunseki
          </h1>
          <p className="text-slate-400">Menyiapkan Mesin Analisis...</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700 flex-shrink-0 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-300">
              {progress.isComplete ? 'Finalizing Setup...' : 'Mengunduh Kamus Lokal'}
            </span>
            <span className="text-sm font-mono text-cyan-400">{percent}%</span>
          </div>

          <div className="w-full bg-slate-700 rounded-full h-3 mb-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${percent}%` }}
            ></div>
          </div>

          <div className="flex items-center text-xs text-slate-500 space-x-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="truncate">
              {progress.filename === 'Done' 
                ? 'Sedang menghubungkan kamus ke mesin analisis...' 
                : `Mendownload: ${progress.filename}...`}
            </span>
          </div>
        </div>

        {/* Debug Console */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 flex-grow flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center">
              System Debug Log
            </span>
            <button 
              onClick={() => logger.downloadLogs()}
              className="flex items-center space-x-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Download Log</span>
            </button>
          </div>
          <div className="p-4 font-mono text-[11px] overflow-y-auto space-y-1 custom-scrollbar flex-grow">
            {logs.map((log, i) => (
              <div key={i} className="flex space-x-2 border-b border-slate-900/50 pb-1">
                <span className="text-slate-600">[{log.timestamp}]</span>
                <span className={`
                  ${log.type === 'error' ? 'text-red-400' : ''}
                  ${log.type === 'warn' ? 'text-yellow-400' : ''}
                  ${log.type === 'success' ? 'text-emerald-400' : ''}
                  ${log.type === 'info' ? 'text-blue-400' : ''}
                `}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
        
        {progress.error && (
           <div className="mt-4 text-red-400 text-sm bg-red-900/20 p-4 rounded-xl border border-red-900/50 flex items-start space-x-3 animate-pulse flex-shrink-0">
             <AlertTriangle className="w-5 h-5 flex-shrink-0" />
             <div>
               <p className="font-bold">Initialization Error</p>
               <p className="text-xs opacity-80">{progress.error}</p>
               <button 
                 onClick={() => window.location.reload()}
                 className="mt-2 text-xs underline font-bold"
               >
                 Refresh Halaman
               </button>
             </div>
           </div>
        )}

        <p className="text-[10px] text-center text-slate-600 mt-6 mb-4">
          Proses "Finalizing" bisa memakan waktu hingga 30 detik pada perangkat mobile atau saat inisialisasi pertama kali.
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;