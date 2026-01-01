import React, { useState, useRef } from 'react';
import { Upload, FileText, Moon, Sun, ArrowLeft, Trash2, Play, AlertCircle, HelpCircle, ExternalLink, Gift, Info, Download } from 'lucide-react';
import { Card, Button, Input, ProgressBar } from './components/ui/UIComponents';
import { Modal } from './components/ui/Modal';
import { analyzeSubtitle } from './lib/analyzer';
import { saveResult } from './lib/db';
import { AnalysisResult, ComparisonData } from './types';
import { JlptChart, FreqChart, RatingCard } from './components/Charts';
import { HistoryList } from './components/HistoryList';
import { JLPT_COLORS, getRatingColor } from './constants';
import { Daikangei } from './daikangei';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [animeName, setAnimeName] = useState("");
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  // New State for holding selected files before analysis
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: "",
    message: ""
  });

  const showAlert = (title: string, message: string) => {
    setAlertState({ isOpen: true, title, message });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleUploadClick = () => {
    // Prevent opening dialog if limit is reached
    if (selectedFiles.length >= 6) {
        showAlert("Limit Reached", "You have already selected 6 files. Please remove some files if you want to change them.");
        return;
    }
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Calculate projected total
      const totalFiles = selectedFiles.length + newFiles.length;

      if (totalFiles > 6) {
          showAlert("Limit Exceeded", `You can only upload a maximum of 6 files. You currently have ${selectedFiles.length} and tried to add ${newFiles.length}.`);
          // Reset input so they can try selecting fewer files
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
      }

      // Append new files to existing list
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
    // Reset input to allow selecting the same file again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleAnalyze = async () => {
    // STRICT RULE: EXACTLY 6 FILES
    if (selectedFiles.length !== 6) {
        showAlert("Invalid File Count", `Analysis requires exactly 6 subtitle files. You currently have ${selectedFiles.length}.`);
        return;
    }

    if (!animeName.trim()) {
        showAlert("Missing Information", "Please enter the Anime Title.");
        return;
    }

    setLoading(true);
    setComparison(null);
    setCurrentResult(null);
    
    try {
      const result = await analyzeSubtitle(selectedFiles, animeName, (msg, p) => {
          setProgressLabel(msg);
          setProgress(p);
      });
      
      await saveResult(result);
      setCurrentResult(result);
      // Clear files after successful analysis
      setSelectedFiles([]);
    } catch (err) {
      console.error(err);
      showAlert("Analysis Failed", "An error occurred during analysis. Please check the console for details.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const formatRank = (rank: number) => {
    if (rank >= 1000) {
        return (rank / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return rank;
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ease-in-out ${darkMode ? 'dark' : ''} bg-gray-50 dark:bg-darker`}>
      {/* --- NEW YEAR WELCOME ANIMATION --- */}
      <Daikangei />

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        {/* Header - Centered & Large */}
        <header className="relative py-8 mb-8 no-print">
          {/* Top Left: About Button */}
          <div className="absolute top-0 left-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
             <button 
              onClick={() => setShowAboutModal(true)}
              className="p-3 rounded-full bg-white dark:bg-card border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95 text-gray-600 dark:text-gray-300"
              aria-label="About"
            >
              <HelpCircle size={20} />
            </button>
          </div>

          {/* Top Right: Theme Toggle */}
          <div className="absolute top-0 right-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <button 
              onClick={toggleTheme} 
              className="p-3 rounded-full bg-white dark:bg-card border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          
          <div className="text-center pt-8 md:pt-4 space-y-2 animate-slide-up">
            <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-tighter filter drop-shadow-sm">
              Jimaku Bunseki
            </h1>
            <p className="text-lg md:text-xl font-medium text-gray-500 dark:text-gray-400 tracking-wide">
              Anime Difficulty Analyzer
            </p>
          </div>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <Card className="w-full max-w-md text-center py-8 animate-scale-in">
              <div className="mb-4">
                 <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                 <h3 className="text-xl font-bold animate-pulse-slow">Analyzing...</h3>
              </div>
              <ProgressBar progress={progress} label={progressLabel} />
            </Card>
          </div>
        )}

        {/* Main Content Area */}
        {!comparison ? (
          <>
            {/* Input Section (Hidden when printing result) */}
            {!currentResult && (
                <div className="mb-8 space-y-4 no-print max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <Card className="border-primary/20 shadow-lg shadow-primary/5">
                        <div className="flex flex-col gap-6">
                            {/* Anime Title Input */}
                            <div className="w-full">
                                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Anime Title</label>
                                <Input 
                                    placeholder="e.g. Monogatari Series Ep 1" 
                                    value={animeName}
                                    onChange={(e) => setAnimeName(e.target.value)}
                                    className="h-12"
                                />
                            </div>

                            {/* Upload Button */}
                            <div className="w-full">
                                <input 
                                    type="file" 
                                    multiple 
                                    accept=".srt" 
                                    className="hidden" 
                                    id="srt-upload"
                                    ref={fileInputRef}
                                    onChange={handleFileSelection}
                                />
                                <button 
                                    onClick={handleUploadClick}
                                    className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-xl font-medium transition-all duration-300 active:scale-95 group ${
                                        selectedFiles.length >= 6 
                                        ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 cursor-not-allowed'
                                        : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                    }`}
                                >
                                    <Upload size={24} className={`transition-transform duration-300 ${selectedFiles.length < 6 ? 'group-hover:scale-110 group-hover:-translate-y-1' : ''}`} />
                                    <span>
                                        {selectedFiles.length >= 6 ? 'Limit Reached (6/6)' : 'Add Subtitle Files (Must be 6)'}
                                    </span>
                                </button>
                                <p className="text-xs text-center text-gray-400 mt-2">
                                    Please upload exactly 6 .srt files to proceed.
                                </p>
                            </div>

                            {/* File List */}
                            {selectedFiles.length > 0 && (
                                <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 animate-fade-in">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase">Selected Files</h4>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded transition-colors ${selectedFiles.length === 6 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                            {selectedFiles.length} / 6
                                        </span>
                                    </div>
                                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                                        {selectedFiles.map((file, index) => (
                                            <li key={index} className="flex items-center justify-between bg-white dark:bg-card p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-sm animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <FileText size={16} className="text-primary shrink-0" />
                                                    <span className="truncate">{file.name}</span>
                                                    <span className="text-xs text-gray-400 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                                                </div>
                                                <button 
                                                    onClick={() => removeFile(index)}
                                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    title="Remove file"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Analyze Button */}
                            <Button 
                                onClick={handleAnalyze}
                                disabled={selectedFiles.length !== 6}
                                className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-indigo-600 hover:from-indigo-600 hover:to-primary disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none dark:disabled:from-gray-700 dark:disabled:to-gray-800 transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <Play size={24} fill="currentColor" />
                                <span>
                                    {selectedFiles.length === 6 ? 'Start Analysis' : `Add ${6 - selectedFiles.length} more file${6 - selectedFiles.length === 1 ? '' : 's'}`}
                                </span>
                            </Button>

                            {/* Download Subtitle Link */}
                            <a 
                                href="https://jimaku.cc" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-bold transition-all duration-200 bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 active:scale-95"
                            >
                                <Download size={20} />
                                <span>Download Subtitle (Jimaku.cc)</span>
                            </a>
                        </div>
                    </Card>
                </div>
            )}

            {/* Analysis Result Dashboard */}
            {currentResult && (
              <div className="space-y-6 animate-slide-up pb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 no-print">
                    <Button variant="outline" onClick={() => { setCurrentResult(null); setAnimeName(""); setSelectedFiles([]); }} className="text-sm h-10">
                        <ArrowLeft size={16} /> New Analysis
                    </Button>
                </div>

                {/* Printable Header */}
                <div className="hidden print-only mb-6 text-center">
                    <h1 className="text-4xl font-bold mb-2">{currentResult.animeName}</h1>
                    <p className="text-gray-500">Analysis Report - Jimaku Bunseki</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {/* Score Card */}
                  <Card className="col-span-1 md:col-span-1 bg-white dark:bg-card border-2 border-transparent relative shadow-md flex items-center justify-center transform hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
                    <RatingCard score={currentResult.difficultyScore} title={currentResult.animeName} />
                  </Card>

                  {/* Stats Grid - Revised to 2 items */}
                  <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3 md:gap-4">
                    <StatCard label="Total Words" value={currentResult.totalWords.toLocaleString()} delay={0.1} />
                    <StatCard label="Avg Sent. Len" value={currentResult.avgSentenceLength.toFixed(1)} suffix=" chars" delay={0.2} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 page-break">
                    <Card className="flex flex-col">
                        <h3 className="text-sm md:text-base font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                            JLPT Distribution
                        </h3>
                        <div className="flex-1 flex items-center justify-center">
                            <JlptChart data={currentResult} />
                        </div>
                    </Card>
                    <Card className="flex flex-col">
                        <h3 className="text-sm md:text-base font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                             <span className="w-1.5 h-5 bg-secondary rounded-full"></span>
                            Frequency Distribution
                        </h3>
                        <div className="flex-1 pt-2">
                             <FreqChart data={currentResult} />
                        </div>
                    </Card>
                </div>

                {/* Top Difficult Words */}
                <Card className="page-break overflow-hidden">
                    <h3 className="text-sm md:text-base font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Top 20 Difficult Words</h3>
                    <div className="overflow-x-auto -mx-6 md:mx-0 px-6 md:px-0">
                        <table className="w-full text-left text-xs md:text-sm whitespace-nowrap md:whitespace-normal">
                            <thead>
                                <tr className="border-b dark:border-gray-700 text-gray-500 font-medium">
                                    <th className="py-3 px-2">Word</th>
                                    <th className="py-3 px-2">JLPT</th>
                                    <th className="py-3 px-2">Rank</th>
                                    <th className="py-3 px-2 text-right">Freq</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentResult.difficultWords.map((w, i) => (
                                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="py-3 px-2 font-jp text-base md:text-lg text-slate-800 dark:text-slate-200">{w.word}</td>
                                        <td className="py-3 px-2">
                                            {w.jlpt ? <span className={`px-2 py-1 rounded text-[10px] text-white font-bold tracking-wider`} style={{ backgroundColor: Object.values(JLPT_COLORS)[5 - w.jlpt] || '#64748b' }}>N{w.jlpt}</span> : <span className="text-gray-400">-</span>}
                                        </td>
                                        <td className="py-3 px-2 text-gray-500">#{formatRank(w.id)}</td>
                                        <td className="py-3 px-2 text-primary font-bold text-right">{w.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
              </div>
            )}

            {/* History List */}
            {!currentResult && (
                <div className="no-print pb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                   <HistoryList 
                      onSelect={(res) => setCurrentResult(res)} 
                      onCompare={(items) => setComparison({ results: items })}
                   />
                </div>
            )}
          </>
        ) : (
          /* Comparison View */
          <div className="animate-slide-up pb-12">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 no-print">
                <Button variant="outline" onClick={() => setComparison(null)}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </Button>
                <h2 className="text-xl md:text-2xl font-bold">Comparison Mode</h2>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {comparison.results.map((res, idx) => (
                    <Card key={idx} className="relative p-0 overflow-hidden border-t-4 border-t-primary animate-scale-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                        <div className="p-5 pb-2">
                            <h3 className="text-lg font-bold mb-2 h-14 line-clamp-2 leading-tight">{res.animeName}</h3>
                            <div className="flex flex-col gap-1 mb-4">
                                <span className="text-xs text-gray-400 uppercase font-semibold">Difficulty Score</span>
                                <span className={`text-4xl font-black ${getRatingColor(res.difficultyScore)}`}>{res.difficultyScore.toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div className="px-5 py-4 bg-gray-50 dark:bg-slate-800/50 space-y-2 text-sm border-t border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Total Words</span>
                                <span className="font-mono font-medium">{res.totalWords.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">N1 Usage</span>
                                <span className="font-mono font-medium">{((res.jlptDistribution.n1 / res.totalWords)*100).toFixed(1)}%</span>
                            </div>
                        </div>

                        <div className="p-5 pt-4">
                             <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">JLPT Spectrum</p>
                             <div className="h-40">
                                <JlptChart data={res} />
                             </div>
                        </div>
                    </Card>
                ))}
             </div>
             
             <div className="mt-8 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-xl text-blue-800 dark:text-blue-200 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <h4 className="font-bold mb-2 flex items-center gap-2 text-lg"><FileText size={20}/> Recommendation</h4>
                <p className="text-sm md:text-base opacity-90">
                    Based on difficulty score, the recommended watch order is:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {[...comparison.results].sort((a,b) => a.difficultyScore - b.difficultyScore).map((r, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="font-bold bg-white dark:bg-blue-900 px-3 py-1 rounded shadow-sm text-sm border border-blue-200 dark:border-blue-800">
                                {i+1}. {r.animeName}
                            </span>
                            {i < comparison.results.length - 1 && <span className="text-blue-400">→</span>}
                        </div>
                    ))}
                </div>
             </div>
          </div>
        )}

        {/* Global Alert Modal */}
        <Modal 
            isOpen={alertState.isOpen} 
            onClose={closeAlert} 
            title={alertState.title}
            footer={
                <Button onClick={closeAlert} className="min-w-[80px]">OK</Button>
            }
        >
            <p className="text-base">{alertState.message}</p>
        </Modal>

        {/* About Modal */}
        <Modal
            isOpen={showAboutModal}
            onClose={() => setShowAboutModal(false)}
            title="About Jimaku Bunseki"
            footer={
                <Button onClick={() => setShowAboutModal(false)}>Close</Button>
            }
        >
            <div className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <Gift size={32} />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">A New Year's Gift</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">For our friends at Philia Space Community</p>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex items-start gap-3">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-full shrink-0">
                         <Info size={20} className="text-blue-500" />
                    </div>
                    <div className="space-y-2 text-sm">
                        <h5 className="font-bold text-slate-700 dark:text-slate-200">Disclaimer: Vocabulary-Based Analysis Only</h5>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            This tool calculates difficulty scores based <strong>strictly on vocabulary occurrences</strong> found within the 6 uploaded subtitle files.
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-gray-500 dark:text-gray-400">
                            <li>It references <strong>JLPT levels</strong> and <strong>BCCWJ frequency rankings</strong>.</li>
                            <li>It does <strong>NOT</strong> evaluate grammar structures, sentence complexity, cultural nuance, slang context, or audio speed.</li>
                            <li>The results are purely statistical and should be treated as a reference for vocabulary density, not a definitive guide to overall comprehension difficulty.</li>
                        </ul>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-xs text-gray-400 mb-2">Created with ❤️ by</p>
                    <a 
                        href="https://philiaspace.my.id" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-indigo-600 font-bold transition-colors"
                    >
                        Philia Space Community <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        </Modal>

      </div>
    </div>
  );
}

const StatCard: React.FC<{ label: string; value: string; suffix?: string; delay?: number }> = ({ label, value, suffix, delay = 0 }) => (
    <div 
        className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center h-24 md:h-28 hover:shadow-md transition-all duration-300 animate-scale-in"
        style={{ animationDelay: `${delay}s` }}
    >
        <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 md:mb-2">{label}</div>
        <div className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-baseline gap-1">
            {value}
            {suffix && <span className="text-xs md:text-sm font-medium text-gray-400">{suffix}</span>}
        </div>
    </div>
);

export default App;