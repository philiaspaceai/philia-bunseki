import React from 'react';
import { DictionaryProgress } from '../types';
import { Loader2 } from 'lucide-react';

interface Props {
  progress: DictionaryProgress;
}

const LoadingScreen: React.FC<Props> = ({ progress }) => {
  const percent = Math.round((progress.current / progress.total) * 100);

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-white z-50">
      <div className="w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Philia Bunseki
          </h1>
          <p className="text-slate-400">Preparing Analysis Engine...</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-300">
              {progress.isComplete ? 'Initializing...' : 'Downloading Dictionary'}
            </span>
            <span className="text-sm font-mono text-accent">{percent}%</span>
          </div>

          <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4 overflow-hidden">
            <div 
              className="bg-accent h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${percent}%` }}
            ></div>
          </div>

          <div className="flex items-center text-xs text-slate-500 space-x-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>
              {progress.filename === 'Done' 
                ? 'Finalizing setup...' 
                : `Fetching ${progress.filename}...`}
            </span>
          </div>
          
          {progress.error && (
             <div className="mt-4 text-red-400 text-xs bg-red-900/20 p-2 rounded">
               Error: {progress.error}. Please refresh to retry.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;