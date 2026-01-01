import React, { useEffect, useState } from 'react';
import { AnalysisResult } from '../types';
import { JLPT_COLORS, FREQ_COLORS, getRatingColor, getRatingLabel, getBadgeStyle } from '../constants';

interface ChartProps {
  data: AnalysisResult;
}

// ==========================================
// 1. RATING CARD (TEXT ONLY - NO METER)
// ==========================================
export const RatingCard: React.FC<{ score: number; title?: string }> = ({ score, title }) => {
  const colorClass = getRatingColor(score);
  const badgeClass = getBadgeStyle(score);
  const label = getRatingLabel(score);
  
  return (
    <div className="flex flex-col items-center justify-center h-full w-full py-4 text-center animate-scale-in">
      {title && (
        <div className="mb-2 max-w-full px-2">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2">
                {title}
            </h2>
        </div>
      )}
      <div className={`text-6xl md:text-7xl font-black tracking-tighter ${colorClass} leading-none drop-shadow-sm transition-colors duration-500`}>
          {score.toLocaleString()}
      </div>
      
      {/* BADGE LABEL */}
      <div className={`mt-3 px-4 py-1 rounded-full text-sm font-bold border uppercase tracking-wider transition-all duration-300 ${badgeClass}`}>
        {label}
      </div>

      <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-[0.25em] mt-3">
          Difficulty Score
      </div>
    </div>
  );
};

// ==========================================
// 2. JLPT CHART (Custom HTML/CSS Bar)
// ==========================================
export const JlptChart: React.FC<ChartProps> = ({ data }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const items = [
    { label: 'N5', count: data.jlptDistribution.n5, color: JLPT_COLORS.n5, desc: 'Basic' },
    { label: 'N4', count: data.jlptDistribution.n4, color: JLPT_COLORS.n4, desc: 'Elem' },
    { label: 'N3', count: data.jlptDistribution.n3, color: JLPT_COLORS.n3, desc: 'Inter' },
    { label: 'N2', count: data.jlptDistribution.n2, color: JLPT_COLORS.n2, desc: 'Pre-Adv' },
    { label: 'N1', count: data.jlptDistribution.n1, color: JLPT_COLORS.n1, desc: 'Adv' },
  ];

  const maxVal = Math.max(...items.map(i => i.count));

  return (
    <div className="w-full flex flex-col justify-center h-full space-y-2">
      {items.map((item, idx) => (
        <div key={item.label} className="flex items-center gap-3 w-full">
          {/* Label */}
          <div className="w-10 flex-shrink-0 flex flex-col items-center">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{item.label}</span>
          </div>

          {/* Bar Container */}
          <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
             <div 
               className="h-full rounded-full transition-all duration-1000 ease-out"
               style={{ 
                 width: `${mounted && maxVal > 0 ? (item.count / maxVal) * 100 : 0}%`, 
                 backgroundColor: item.color,
                 transitionDelay: `${idx * 100}ms` 
               }}
             />
          </div>

          {/* Value */}
          <div className="w-16 flex-shrink-0 text-right">
             <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200">
               {item.count.toLocaleString()}
             </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// 3. FREQ CHART (Custom HTML/CSS Bar)
// ==========================================
export const FreqChart: React.FC<ChartProps> = ({ data }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
     const timer = setTimeout(() => setMounted(true), 100);
     return () => clearTimeout(timer);
  }, []);

  const items = [
    { label: 'Core', sub: '1k', count: data.freqDistribution.top1k, color: FREQ_COLORS.top1k },
    { label: 'Basic', sub: '5k', count: data.freqDistribution.top5k, color: FREQ_COLORS.top5k },
    { label: 'Mid', sub: '10k', count: data.freqDistribution.top10k, color: FREQ_COLORS.top10k },
    { label: 'High', sub: '20k', count: data.freqDistribution.top20k, color: FREQ_COLORS.top20k },
    { label: 'Rare', sub: '>20k', count: data.freqDistribution.rare, color: FREQ_COLORS.rare },
  ];

  const maxVal = Math.max(...items.map(i => i.count));

  return (
    <div className="w-full flex flex-col justify-center h-full space-y-2">
      {items.map((item, idx) => (
        <div key={item.label} className="flex items-center gap-3 w-full">
           {/* Label */}
           <div className="w-10 flex-shrink-0 flex flex-col items-end px-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none">{item.label}</span>
          </div>

          {/* Bar Container */}
          <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${mounted && maxVal > 0 ? (item.count / maxVal) * 100 : 0}%`, 
                backgroundColor: item.color,
                transitionDelay: `${idx * 100}ms`
              }}
            />
          </div>

          {/* Value */}
          <div className="w-16 flex-shrink-0 text-right">
             <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200">
               {item.count.toLocaleString()}
             </span>
          </div>
        </div>
      ))}
    </div>
  );
};