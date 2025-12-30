
import React, { useState, useCallback, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import AnalysisInProgress from './components/AnalysisInProgress';
import ResultsDisplay from './components/ResultsDisplay';
import { runAnalysis } from './services/analyzer';
import type { AnalysisResult, AppStatus } from './types';
import LogButton from './components/LogButton';
import { logger } from './services/logger';
import SupabaseStatusIndicator from './components/SupabaseStatusIndicator';
import { supabase } from './lib/supabaseClient';

const App: React.FC = () => {
    const [status, setStatus] = useState<AppStatus>('idle');
    const [results, setResults] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');

    useEffect(() => {
        logger.log('Aplikasi dimuat dan siap digunakan.');

        const checkSupabaseConnection = async () => {
            const { error } = await supabase.from('jlpt').select('word').limit(1);
            if (error) {
                setSupabaseStatus('error');
                logger.log(`Koneksi Supabase gagal: ${error.message}`);
            } else {
                setSupabaseStatus('connected');
                 logger.log('Koneksi Supabase berhasil.');
            }
        };

        checkSupabaseConnection();
    }, []);

    const handleAnalysis = useCallback(async (files: File[]) => {
        logger.log(`Analisis dimulai dengan ${files.length} file.`);
        setStatus('analyzing');
        setError(null);
        setResults(null);
        
        try {
            const analysisResults = await runAnalysis(files, setProgressMessage);
            setResults(analysisResults);
            setStatus('success');
            logger.log(`Analisis berhasil. Level prediksi: ${analysisResults.predictedLevel.level}`);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
                logger.log(`Analisis gagal: ${err.message}`);
            } else {
                const unknownError = 'Terjadi kesalahan yang tidak diketahui.';
                setError(unknownError);
                logger.log(`Analisis gagal: ${unknownError}`);
            }
            setStatus('error');
        }
    }, []);

    const handleReset = useCallback(() => {
        logger.log('Analisis di-reset, kembali ke halaman utama.');
        setStatus('idle');
        setResults(null);
        setError(null);
    }, []);

    const renderContent = () => {
        switch (status) {
            case 'analyzing':
                return <AnalysisInProgress message={progressMessage} />;
            case 'success':
                return results && <ResultsDisplay results={results} onReset={handleReset} />;
            case 'error':
                return (
                    <div className="text-center p-8">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">Analisis Gagal</h2>
                        <p className="text-gray-400 bg-gray-800 p-4 rounded-lg">{error}</p>
                        <button
                            onClick={handleReset}
                            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
                        >
                            Coba Lagi
                        </button>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <div className="text-center">
                       <header className="py-8 sm:py-12">
                            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600 mb-2 animate-fade-in-down">
                                Philia Bunseki
                            </h1>
                            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto animate-fade-in-up">
                                Unggah file subtitle (.srt) berbahasa Jepang untuk menganalisis tingkat kesulitan kosakata dan memprediksi level JLPT-nya.
                            </p>
                        </header>
                        <FileUploader onAnalyze={handleAnalysis} />
                         <div className="mt-8 text-sm text-gray-500 max-w-3xl mx-auto px-4">
                            <h3 className="font-semibold text-gray-400">Penting:</h3>
                            <p>Akurasi analisis bergantung pada tokenisasi kata. Aplikasi ini menggunakan metode sederhana di sisi klien. Untuk hasil terbaik dengan segmentasi kata menggunakan SudachiJS, aplikasi ini harus di-deploy di Vercel dengan API Route Next.js, karena SudachiJS membutuhkan lingkungan Node.js.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-start p-4 sm:p-6 selection:bg-indigo-500 selection:text-white pt-24 sm:pt-20 relative">
            <header className="absolute top-0 left-0 right-0 w-full flex justify-between items-center p-4 sm:p-6">
                <SupabaseStatusIndicator status={supabaseStatus} />
                <LogButton />
            </header>
            <main className="w-full max-w-4xl mx-auto">
                {renderContent()}
            </main>
            <footer className="w-full text-center p-4 mt-8 text-gray-500 text-sm">
                <p>Dibuat dengan elegan untuk perjalanan belajar bahasamu.</p>
            </footer>
        </div>
    );
};

export default App;