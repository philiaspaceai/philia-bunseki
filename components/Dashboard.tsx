import React from 'react';
import { AnalysisStats, WordAnalysis } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { Download, BookOpen, AlertCircle } from 'lucide-react';

interface Props {
  stats: AnalysisStats;
  wordList: WordAnalysis[];
  reset: () => void;
}

const COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#94a3b8'];

const Dashboard: React.FC<Props> = ({ stats, wordList, reset }) => {
  const jlptData = [
    { name: 'N5', count: stats.coverage.n5 },
    { name: 'N4', count: stats.coverage.n4 },
    { name: 'N3', count: stats.coverage.n3 },
    { name: 'N2', count: stats.coverage.n2 },
    { name: 'N1', count: stats.coverage.n1 },
    { name: 'Unk', count: stats.coverage.unknown },
  ];

  const freqData = [
    { name: 'Very Common', value: stats.bccwjDistribution.veryCommon },
    { name: 'Common', value: stats.bccwjDistribution.common },
    { name: 'Uncommon', value: stats.bccwjDistribution.uncommon },
    { name: 'Rare', value: stats.bccwjDistribution.rare },
  ];

  // Learning Priority: High freq in subtitle, existing JLPT level, excluding N5 if advanced
  const priorityList = wordList
    .filter(w => w.count >= 2 && w.jlptLevel && w.jlptLevel < 5) 
    .slice(0, 50);

  const downloadCSV = () => {
    const headers = "Word,Reading,JLPT,Frequency,Count\n";
    const rows = priorityList.map(w => 
      `${w.token.basic_form},${w.token.reading || ''},N${w.jlptLevel},${w.bccwjRank || ''},${w.count}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'philia_vocab_list.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
             <h1 className="text-xl font-bold text-slate-800">Philia Bunseki</h1>
          </div>
          <button onClick={reset} className="text-sm font-medium text-slate-500 hover:text-indigo-600">
            Analyze New File
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
             <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Estimated Level</span>
             <span className={`text-5xl font-black mt-2 ${
               stats.overallDifficulty === 'N5' ? 'text-green-500' :
               stats.overallDifficulty === 'N4' ? 'text-lime-500' :
               stats.overallDifficulty === 'N3' ? 'text-yellow-500' :
               stats.overallDifficulty === 'N2' ? 'text-orange-500' : 'text-red-500'
             }`}>{stats.overallDifficulty}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
             <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Total Words</span>
             <span className="text-3xl font-bold text-slate-700 mt-2">{stats.totalWords.toLocaleString()}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
             <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Unique Vocab</span>
             <span className="text-3xl font-bold text-slate-700 mt-2">{stats.uniqueWords.toLocaleString()}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
             <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Recommendation</span>
             <p className="text-sm font-medium text-slate-600 mt-2">{stats.recommendation}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Coverage Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-indigo-500"/> Vocabulary by JLPT Level
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jlptData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {jlptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Frequency Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-pink-500"/> Difficulty Distribution
            </h3>
            <div className="h-64 flex justify-center">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={freqData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {freqData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Priority List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Priority Vocabulary List</h3>
              <p className="text-sm text-slate-500">Words appearing frequently that you should know.</p>
            </div>
            <button 
              onClick={downloadCSV}
              className="flex items-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Word</th>
                  <th className="px-6 py-4">Reading</th>
                  <th className="px-6 py-4">JLPT</th>
                  <th className="px-6 py-4">Freq Rank</th>
                  <th className="px-6 py-4">Occurrences</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {priorityList.map((w, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 text-lg">{w.token.basic_form}</td>
                    <td className="px-6 py-4">{w.token.reading || '-'}</td>
                    <td className="px-6 py-4">
                      {w.jlptLevel ? (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          w.jlptLevel >= 4 ? 'bg-green-100 text-green-700' :
                          w.jlptLevel === 3 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>N{w.jlptLevel}</span>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {w.bccwjRank ? `#${w.bccwjRank.toLocaleString()}` : 'Unranked'}
                    </td>
                    <td className="px-6 py-4 text-indigo-600 font-medium">
                      {w.count}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {priorityList.length === 0 && (
             <div className="p-12 text-center text-slate-400">
               No high-priority words found (most words are either too basic or too rare).
             </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;