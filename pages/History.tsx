import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, deleteAnalysis } from '../services/db';
import { HistoryItem } from '../types';
import { Trash2, ChevronRight, BarChart2 } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getHistory();
    setItems(data);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Yakin ingin menghapus data ini?')) {
      await deleteAnalysis(id);
      loadData();
    }
  };

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Riwayat Analisis</h1>
      
      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="text-slate-400 mb-4 text-6xl">📂</div>
          <h3 className="text-xl font-medium text-slate-900">Belum ada riwayat</h3>
          <p className="text-slate-500 mt-2">Upload file subtitle untuk memulai analisis pertamamu.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item, idx) => (
            <div 
              key={item.id}
              onClick={() => navigate(`/report/${item.id}`)}
              className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 cursor-pointer transition-all duration-300 group flex flex-col md:flex-row items-center justify-between"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex-grow">
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {item.fileName}
                </h3>
                <div className="text-sm text-slate-500 mt-1 mb-3 md:mb-0">
                  {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className="text-center">
                  <div className="text-xs text-slate-400 uppercase font-semibold">JLPT</div>
                  <div className="font-bold text-slate-700">{item.jlptConclusion}</div>
                </div>
                <div className="text-center">
                   <div className="text-xs text-slate-400 uppercase font-semibold">Score</div>
                   <div className={`font-bold text-lg ${item.overallScore > 70 ? 'text-red-500' : item.overallScore > 40 ? 'text-amber-500' : 'text-green-500'}`}>
                     {item.overallScore}
                   </div>
                </div>
                
                <div className="flex items-center gap-2 pl-4 border-l border-slate-100">
                   <button 
                     onClick={(e) => handleDelete(e, item.id)}
                     className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                   >
                     <Trash2 size={18} />
                   </button>
                   <ChevronRight className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};