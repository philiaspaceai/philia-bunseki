import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAnalysisById } from '../services/db';
import { AnalysisResult, WordAnalysis } from '../types';
import { JLPT_COLORS, BCCWJ_COLORS } from '../constants';
import { DistributionBarChart, DistributionPieChart } from '../components/Charts';
import { Download, ArrowLeft, Search } from 'lucide-react';

export const Report: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    if (!id) return;
    getAnalysisById(id).then(res => {
      if (res) setData(res);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="text-center py-20 text-slate-500">Memuat laporan...</div>;
  if (!data) return <div className="text-center py-20 text-red-500">Data tidak ditemukan.</div>;

  // Prepare chart data
  const jlptChartData = Object.entries(data.jlptStats).map(([key, val]: [string, { count: number; percentage: number }]) => ({ name: key, value: val.count }));
  const bccwjChartData = Object.entries(data.bccwjStats).map(([key, val]: [string, { count: number; percentage: number }]) => ({ name: key, value: val.count }));

  const filteredWords = data.wordList
    .filter(w => w.word.includes(searchTerm) || w.reading?.includes(searchTerm))
    .slice(0, limit);

  const exportCSV = () => {
    const headers = "Word,Reading,Count,JLPT,BCCWJ Level\n";
    const rows = data.wordList.map(w => 
      `${w.word},${w.reading},${w.count},${w.jlptLevel || 'Unknown'},${w.bccwjLevel}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title}_philia_analysis.csv`;
    a.click();
  };

  return (
    <div className="space-y-8 fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate('/history')} className="text-sm text-slate-500 hover:text-indigo-600 flex items-center mb-2">
            <ArrowLeft size={16} className="mr-1"/> Kembali
          </button>
          <h1 className="text-3xl font-bold text-slate-900">{data.title}</h1>
          <p className="text-slate-500 text-sm mt-1">{new Date(data.timestamp).toLocaleString()} • {data.totalWords.toLocaleString()} Kata Total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors">
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Score Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-lg grid md:grid-cols-4 gap-8 items-center">
        <div className="md:col-span-1 text-center md:text-left">
          <div className="text-indigo-100 text-sm font-medium uppercase tracking-wider mb-1">Overall Difficulty</div>
          <div className="text-6xl font-bold">{data.overallScore}<span className="text-2xl opacity-50">/100</span></div>
        </div>
        <div className="md:col-span-3 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
               <div className="text-xs text-indigo-100 uppercase">JLPT Estimate</div>
               <div className="text-2xl font-bold">{data.jlptConclusion}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
               <div className="text-xs text-indigo-100 uppercase">Vocab Level</div>
               <div className="text-2xl font-bold">{data.bccwjConclusion}</div>
            </div>
          </div>
          <div className="bg-white/20 p-3 rounded-lg text-sm flex items-start gap-2">
             <span className="text-lg">💡</span> {data.recommendation}
          </div>
        </div>
      </div>

      {/* Stats Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* JLPT Stats */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex justify-between">
            <span>JLPT Distribution</span>
            <span className="text-xs font-normal bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">N5 = Easy</span>
          </h3>
          <div className="flex flex-col md:flex-row gap-4 items-center">
             <div className="w-full md:w-1/2">
                <DistributionPieChart data={jlptChartData} dataKey="value" nameKey="name" colors={JLPT_COLORS} />
             </div>
             <div className="w-full md:w-1/2 space-y-2">
                {Object.entries(data.jlptStats).map(([k, v]: [string, { count: number; percentage: number }]) => (
                  <div key={k} className="flex justify-between text-sm items-center">
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: JLPT_COLORS[k as keyof typeof JLPT_COLORS]}}></span>
                      <span className="text-slate-600">{k}</span>
                    </div>
                    <div className="text-slate-900 font-mono">{v.percentage}% <span className="text-slate-400 text-xs">({v.count})</span></div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* BCCWJ Stats */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex justify-between">
            <span>Frequency Distribution</span>
            <span className="text-xs font-normal bg-green-50 text-green-600 px-2 py-1 rounded-full">Beginner = Common</span>
          </h3>
          <div className="w-full mb-4">
             <DistributionBarChart data={bccwjChartData} dataKey="value" nameKey="name" colors={BCCWJ_COLORS} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(data.bccwjStats).map(([k, v]: [string, { count: number; percentage: number }]) => (
                  <div key={k} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                    <span className="text-slate-600 truncate">{k}</span>
                    <span className="font-bold text-slate-800">{v.percentage}%</span>
                  </div>
              ))}
          </div>
        </div>
      </div>

      {/* Word List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-lg text-slate-800">Word Analysis</h3>
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search words..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Word</th>
                <th className="px-6 py-4">Reading</th>
                <th className="px-6 py-4">Freq</th>
                <th className="px-6 py-4">JLPT</th>
                <th className="px-6 py-4">BCCWJ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWords.map((w, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-900 font-jp text-lg">{w.word}</td>
                  <td className="px-6 py-3 text-slate-500 font-jp">{w.reading}</td>
                  <td className="px-6 py-3 text-slate-600">{w.count}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 rounded text-xs font-medium text-white" style={{ backgroundColor: JLPT_COLORS[`N${w.jlptLevel}` as keyof typeof JLPT_COLORS] || JLPT_COLORS.Unknown }}>
                      {w.jlptLevel ? `N${w.jlptLevel}` : 'UNK'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 rounded text-xs font-medium border" style={{ borderColor: BCCWJ_COLORS[w.bccwjLevel], color: BCCWJ_COLORS[w.bccwjLevel] }}>
                      {w.bccwjLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredWords.length < data.wordList.length && (
          <div className="p-4 text-center border-t border-slate-100">
            <button onClick={() => setLimit(prev => prev + 50)} className="text-indigo-600 font-medium hover:underline">
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};