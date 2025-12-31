import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Upload, FileText, BarChart3, Clock, ChevronRight, AlertCircle, 
  CheckCircle, Download, Trash2, Layers, Search, X 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { parseSRT } from './services/parser';
import { analyzeSubtitle } from './services/analysis';
import { saveAnalysis, getAllHistory, getAnalysisById, deleteAnalysis } from './services/db';
import { AnalysisResult, Token, WordData, JLPTLevel, BCCWJLevel } from './types';

// --- Constants ---
const COLORS_JLPT = {
  N5: '#4ade80', N4: '#60a5fa', N3: '#818cf8', N2: '#c084fc', N1: '#f472b6', Unknown: '#94a3b8'
};
const COLORS_BCCWJ = {
  Beginner: '#4ade80', Elementary: '#60a5fa', Intermediate: '#818cf8', Advanced: '#c084fc', Expert: '#f472b6', Unknown: '#94a3b8'
};

// --- Components ---

const LoadingOverlay = ({ message, progress }: { message: string, progress?: number }) => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
    <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
    <h3 className="text-xl font-semibold text-slate-800 animate-pulse">{message}</h3>
    {progress !== undefined && (
      <div className="w-64 h-2 bg-slate-200 rounded-full mt-4 overflow-hidden">
        <div 
          className="h-full bg-primary-600 transition-all duration-300" 
          style={{ width: `${progress}%` }}
        />
      </div>
    )}
    {progress !== undefined && <p className="text-sm text-slate-500 mt-2">{progress}%</p>}
  </div>
);

const FileUpload = ({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPass(Array.from(e.dataTransfer.files));
    }
  };

  const validateAndPass = (files: File[]) => {
    const srtFiles = files.filter(f => f.name.toLowerCase().endsWith('.srt'));
    if (srtFiles.length > 0) onFilesSelected(srtFiles);
    else alert('Mohon upload file .srt');
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer ${
        isDragging ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'
      }`}
      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" multiple accept=".srt" className="hidden" ref={fileInputRef}
        onChange={(e) => e.target.files && validateAndPass(Array.from(e.target.files))}
      />
      <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
        <Upload size={32} />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Upload Subtitle Anime (.srt)</h3>
      <p className="text-slate-500 text-sm">Drag & drop atau klik untuk memilih file</p>
      <div className="mt-4 flex gap-2 justify-center flex-wrap">
        <span className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600 font-medium">UTF-8</span>
        <span className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600 font-medium">Shift-JIS</span>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtext, color = "bg-white" }: any) => (
  <div className={`${color} p-6 rounded-2xl shadow-sm border border-slate-100`}>
    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
    <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
    {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
  </div>
);

// --- Pages ---

const HomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState('');

  const processFile = async (files: File[]) => {
    // Check if localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // NOTE: In a real scenario, we block localhost. For this demo, we mock the tokenizer if local 
    // to allow the UI to be demonstrated, but warn the user.
    if (isLocalhost) {
      if(!confirm("⚠️ PERHATIAN: Analisis akurat membutuhkan Vercel Serverless Function (Sudachi). Di Localhost, kami akan menggunakan mock data untuk demonstrasi UI. Lanjutkan?")) return;
    }

    setLoading(true);
    setLoadingMsg('Membaca file...');

    try {
      const file = files[0]; // Process first file for MVP
      const text = await file.text();
      const srtText = parseSRT(text);

      setLoadingMsg('Tokenisasi kalimat...');
      setProgress(5);

      let tokens: Token[] = [];

      if (isLocalhost) {
        // MOCK DATA for Localhost demo
        await new Promise(r => setTimeout(r, 1000)); // Simulate delay
        tokens = srtText.split(/\s+/).map(w => ({ surface: w, dictionaryForm: w }));
      } else {
        // Call Vercel API
        const response = await fetch('/api/tokenize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: srtText })
        });
        
        if (!response.ok) throw new Error('Gagal menghubungi server analisis.');
        const data = await response.json();
        tokens = data.tokens;
      }

      const { stats, allWords } = await analyzeSubtitle(tokens, (msg, val) => {
        setLoadingMsg(msg);
        setProgress(val);
      });

      // Save to DB
      const result: Omit<AnalysisResult, 'id'> = {
        title: file.name.replace('.srt', ''),
        fileName: file.name,
        timestamp: Date.now(),
        stats,
        topWords: allWords.sort((a, b) => b.count - a.count).slice(0, 50),
        hardWords: allWords.filter(w => w.jlpt === 'N1' || w.jlpt === 'Unknown').slice(0, 50),
        allWords: allWords // In real app, maybe don't save ALL to IndexedDB to save space, but ok for now
      };

      const id = await saveAnalysis(result);
      navigate(`/result/${id}`);

    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {loading && <LoadingOverlay message={loadingMsg} progress={progress} />}
      
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 leading-tight">
          Analisis Tingkat Bahasa <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">
            Anime Favoritmu
          </span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Philia Bunrei menggunakan JLPT & BCCWJ Corpus untuk menentukan seberapa sulit subtitle anime Anda. Upload file .srt dan dapatkan analisis lengkapnya.
        </p>
      </div>

      <FileUpload onFilesSelected={processFile} />

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4"><Layers size={24}/></div>
          <h3 className="font-semibold text-slate-800 mb-2">JLPT Breakdown</h3>
          <p className="text-sm text-slate-500">Lihat distribusi level N5 hingga N1 secara detail.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4"><BarChart3 size={24}/></div>
          <h3 className="font-semibold text-slate-800 mb-2">Frequensi Kata</h3>
          <p className="text-sm text-slate-500">Analisis berdasarkan seberapa umum kata digunakan di Jepang.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4"><CheckCircle size={24}/></div>
          <h3 className="font-semibold text-slate-800 mb-2">Rekomendasi</h3>
          <p className="text-sm text-slate-500">Dapatkan saran apakah anime ini cocok untuk level Anda.</p>
        </div>
      </div>
    </div>
  );
};

const ResultPage = () => {
  const { id } = React.useMemo(() => {
     // useLocation hook helper needed if using router params, but we are using hash router params manually extracted or use useParams
     // Since React Router v6
     return { id: window.location.hash.split('/')[2] };
  }, [window.location.hash]);

  const [data, setData] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'words'>('stats');

  useEffect(() => {
    if (id) {
      getAnalysisById(Number(id)).then(res => {
        if (res) setData(res);
      });
    }
  }, [id]);

  if (!data) return <LoadingOverlay message="Memuat hasil..." />;

  const jlptChartData = Object.entries(data.stats.jlptDistribution).map(([name, val]) => {
    const v = val as { count: number; percentage: number };
    return { name, value: v.count, percentage: v.percentage };
  });

  const bccwjChartData = Object.entries(data.stats.bccwjDistribution).map(([name, val]) => {
    const v = val as { count: number; percentage: number };
    return { name, value: v.count, percentage: v.percentage };
  });

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title}_analysis.json`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{data.title}</h1>
          <p className="text-slate-500 flex items-center gap-2 mt-1">
            <FileText size={16} /> {data.fileName}
            <span className="text-slate-300">|</span>
            <Clock size={16} /> {new Date(data.timestamp).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportJSON} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
            <Download size={18} /> Export JSON
          </button>
        </div>
      </div>

      {/* Score Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-2 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-primary-100 font-medium mb-1">Skor Kesulitan</p>
            <div className="flex items-end gap-2">
              <h2 className="text-5xl font-bold">{data.stats.overallScore}</h2>
              <span className="text-2xl opacity-80">/ 100</span>
            </div>
            <div className="mt-4 inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium">
              Grade {data.stats.grade}
            </div>
            <p className="mt-4 text-primary-50">{data.stats.recommendation}</p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
             <BarChart3 size={200} />
          </div>
        </div>
        <StatCard title="Total Kata Unik" value={data.stats.uniqueWords.toLocaleString()} subtext="Kata dasar (lemma)" />
        <StatCard title="Total Kata" value={data.stats.totalWords.toLocaleString()} subtext="Termasuk pengulangan" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveTab('stats')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'stats' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Statistik & Grafik
          {activeTab === 'stats' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('words')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'words' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Daftar Kata ({data.allWords.length})
          {activeTab === 'words' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
        </button>
      </div>

      {activeTab === 'stats' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          {/* JLPT Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Distribusi JLPT</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jlptChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={40} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {jlptChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_JLPT[entry.name as keyof typeof COLORS_JLPT] || '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
               {jlptChartData.map(d => (
                 <div key={d.name} className="bg-slate-50 p-2 rounded text-center">
                   <div className="text-xs text-slate-500">{d.name}</div>
                   <div className="font-bold text-slate-800">{d.percentage}%</div>
                 </div>
               ))}
            </div>
          </div>

          {/* BCCWJ Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Distribusi Frekuensi (BCCWJ)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bccwjChartData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {bccwjChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_BCCWJ[entry.name as keyof typeof COLORS_BCCWJ] || '#cbd5e1'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Kata</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Level JLPT</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Level Frekuensi</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.allWords.slice(0, 100).map((word, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-jp font-medium text-slate-800">{word.word}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600"
                        style={{ backgroundColor: `${COLORS_JLPT[word.jlpt] || '#e2e8f0'}30`, color: COLORS_JLPT[word.jlpt] || '#64748b' }}
                      >
                        {word.jlpt}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">{word.bccwj}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{word.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 border-t border-slate-100">
            Menampilkan 100 kata pertama dari {data.stats.uniqueWords} kata unik.
          </div>
        </div>
      )}
    </div>
  );
};

const HistoryPage = () => {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    getAllHistory().then(setHistory);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if(confirm('Hapus analisis ini?')) {
      await deleteAnalysis(id);
      loadHistory();
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Riwayat Analisis</h1>
      
      {history.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500">Belum ada riwayat analisis.</p>
          <Link to="/" className="text-primary-600 font-medium hover:underline mt-2 inline-block">Mulai Analisis</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map(item => (
            <div 
              key={item.id}
              onClick={() => navigate(`/result/${item.id}`)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer flex justify-between items-center group"
            >
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">{item.title}</h3>
                <div className="flex gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Clock size={14}/> {new Date(item.timestamp).toLocaleDateString()}</span>
                  <span className="text-primary-600 font-medium">{item.stats.grade} Grade</span>
                  <span>•</span>
                  <span>{item.stats.overallScore} / 100</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <div className="text-xs text-slate-400">Total Kata</div>
                  <div className="font-medium text-slate-700">{item.stats.uniqueWords}</div>
                </div>
                <button 
                  onClick={(e) => item.id && handleDelete(e, item.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <ChevronRight className="text-slate-300 group-hover:text-primary-500 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Layout ---

const Navigation = () => (
  <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
    <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-800">
        <div className="w-8 h-8 bg-gradient-to-tr from-primary-600 to-accent-600 rounded-lg flex items-center justify-center text-white font-serif italic">
          P
        </div>
        Philia Bunrei
      </Link>
      <div className="flex gap-6">
        <Link to="/" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Home</Link>
        <Link to="/history" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">History</Link>
      </div>
    </div>
  </nav>
);

const App = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary-100 selection:text-primary-700">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;