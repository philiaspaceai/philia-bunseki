import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '../components/FileUpload';
import { parseSRT } from '../services/parser';
import { tokenizeText } from '../services/tokenizer';
import { fetchJLPTData, fetchBCCWJData } from '../services/supabase';
import { analyzeSubtitle } from '../services/analysis';
import { saveAnalysis } from '../services/db';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

type Step = 'idle' | 'parsing' | 'tokenizing' | 'fetching' | 'analyzing' | 'saving' | 'done';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processFiles = async (files: File[]) => {
    setError(null);
    setStep('parsing');
    setProgress(10);

    try {
      const file = files[0]; // Handle single file for now for simplicity, iterate for multi-upload
      
      // 1. Read File
      const text = await readFile(file);
      
      // 2. Parse SRT
      const cleanText = parseSRT(text);
      if (!cleanText) throw new Error("File subtitle kosong atau tidak valid.");
      setProgress(30);

      // 3. Tokenize (Serverless)
      setStep('tokenizing');
      const tokens = await tokenizeText(cleanText);
      if (!tokens || tokens.length === 0) throw new Error("Gagal memisahkan kata (Tokenization failed).");
      setProgress(50);

      // 4. Fetch DB
      setStep('fetching');
      const [jlptData, bccwjData] = await Promise.all([
        fetchJLPTData(tokens),
        fetchBCCWJData(tokens)
      ]);
      setProgress(80);

      // 5. Analyze
      setStep('analyzing');
      const result = analyzeSubtitle(file.name, tokens, jlptData, bccwjData);
      setProgress(90);

      // 6. Save
      setStep('saving');
      await saveAnalysis(result);
      setProgress(100);

      // Done
      setStep('done');
      // Navigate to results
      setTimeout(() => navigate(`/report/${result.id}`), 500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan yang tidak diketahui.");
      setStep('idle');
    }
  };

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      // Attempt to read as UTF-8 first. For robust encoding support, we'd need a library like chardet
      // But standard FileReader often handles BOM automatically.
      reader.readAsText(file); 
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 fade-in">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
          Analisis Tingkat Kesulitan <br/>
          <span className="text-indigo-600">Subtitle Anime Jepang</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Upload file .srt anime favoritmu. AI kami akan membedah kosakata, 
          mencocokkan dengan level JLPT & frekuensi BCCWJ.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100 p-2">
        <FileUpload onFilesSelected={processFiles} isLoading={step !== 'idle'} />
      </div>

      {step !== 'idle' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {step === 'done' ? (
                 <div className="p-2 bg-green-100 text-green-600 rounded-full"><CheckCircle2 size={24}/></div>
              ) : (
                 <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full animate-spin"><Loader2 size={24}/></div>
              )}
              <div>
                <h4 className="font-semibold text-slate-800 capitalize">
                  {step === 'parsing' && 'Membaca subtitle...'}
                  {step === 'tokenizing' && 'Memisahkan kata (Tokenizing)...'}
                  {step === 'fetching' && 'Mengambil data database...'}
                  {step === 'analyzing' && 'Menghitung statistik...'}
                  {step === 'saving' && 'Menyimpan hasil...'}
                  {step === 'done' && 'Selesai!'}
                </h4>
                <p className="text-xs text-slate-500">Mohon tunggu sebentar</p>
              </div>
            </div>
            <span className="text-indigo-600 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 text-red-700 slide-up">
          <AlertTriangle className="flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold">Terjadi Kesalahan</h4>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 text-center text-slate-500 text-sm">
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <strong className="block text-indigo-600 text-xl mb-1">JLPT</strong>
          Cek level N5 - N1
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <strong className="block text-indigo-600 text-xl mb-1">BCCWJ</strong>
          Analisis frekuensi kata
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <strong className="block text-indigo-600 text-xl mb-1">Offline</strong>
          Simpan hasil di browser
        </div>
      </div>
    </div>
  );
};