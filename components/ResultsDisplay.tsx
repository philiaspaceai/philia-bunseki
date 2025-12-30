
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { AnalysisResult } from '../types';
import { TrophyIcon } from './icons/TrophyIcon';
import { BookIcon } from './icons/BookIcon';
import { ChartIcon } from './icons/ChartIcon';

interface ResultsDisplayProps {
    results: AnalysisResult;
    onReset: () => void;
}

const COLORS = {
    N5: '#4ade80', // green-400
    N4: '#22d3ee', // cyan-400
    N3: '#60a5fa', // blue-400
    N2: '#f472b6', // pink-400
    N1: '#f87171', // red-400
    Unknown: '#9ca3af' // gray-400
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; description: string }> = ({ icon, title, value, description }) => (
    <div className="bg-gray-800/50 p-6 rounded-xl flex flex-col items-start space-y-2 transition-all duration-300 hover:bg-gray-800 hover:shadow-lg hover:shadow-indigo-500/10">
        <div className="text-indigo-400 mb-2">{icon}</div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500">{description}</p>
    </div>
);


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onReset }) => {
    const [visibleList, setVisibleList] = useState<keyof typeof results.stats.jlptWordLists | null>(null);
    const { stats, predictedLevel } = results;

    const pieData = Object.entries(stats.jlptDistribution)
        .map(([name, value]) => ({ name, value }))
        // Fix: Cast item.value to a number to allow comparison, as its type was being inferred as 'unknown'.
        .filter(item => (item.value as number) > 0)
        .sort((a, b) => {
             const order = ['N5', 'N4', 'N3', 'N2', 'N1', 'Unknown'];
             return order.indexOf(a.name) - order.indexOf(b.name);
        });

    const toggleListVisibility = (level: keyof typeof results.stats.jlptWordLists) => {
        setVisibleList(visibleList === level ? null : level);
    };

    return (
        <div className="space-y-8 p-4 animate-fade-in-up">
            <div className="text-center">
                <h2 className="text-lg font-medium text-indigo-400">Prediksi Tingkat Kesulitan</h2>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mt-1">{predictedLevel.level}</h1>
                <p className="text-gray-400 max-w-xl mx-auto mt-2">{predictedLevel.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                 <StatCard 
                    icon={<TrophyIcon className="w-8 h-8"/>} 
                    title="Peringkat Frekuensi Rata-rata" 
                    value={stats.averageFrequencyRank.toLocaleString()}
                    description="Lebih rendah lebih umum (Korpus BCCWJ)"
                />
                 <StatCard 
                    icon={<BookIcon className="w-8 h-8"/>} 
                    title="Kata Unik" 
                    value={stats.uniqueWords.toLocaleString()}
                    description={`Dari total ${stats.totalWords.toLocaleString()} kata`}
                />
                 <StatCard 
                    icon={<ChartIcon className="w-8 h-8"/>} 
                    title="Kosakata Dikenali" 
                    value={`${(100 - (stats.jlptDistribution.Unknown / stats.uniqueWords * 100)).toFixed(1)}%`}
                    description={`${stats.jlptDistribution.Unknown.toLocaleString()} kata tidak dikenal`}
                />
            </div>

            <div className="bg-gray-800/50 p-6 rounded-xl">
                 <h3 className="text-xl font-semibold mb-4 text-center text-gray-200">Distribusi Kosakata JLPT</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius="80%"
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2937', // gray-800
                                    borderColor: '#4f46e5', // indigo-600
                                    borderRadius: '0.5rem'
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="bg-gray-800/50 p-6 rounded-xl">
                 <h3 className="text-xl font-semibold mb-4 text-center text-gray-200">Daftar Kata yang Ditemukan</h3>
                 <div className="flex flex-wrap justify-center gap-2">
                    {(Object.keys(stats.jlptWordLists) as Array<keyof typeof stats.jlptWordLists>).map(level => (
                        stats.jlptWordLists[level].length > 0 && (
                            <button
                                key={level}
                                onClick={() => toggleListVisibility(level)}
                                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${visibleList === level ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            >
                                {level} ({stats.jlptWordLists[level].length})
                            </button>
                        )
                    ))}
                 </div>
                 {visibleList && (
                    <div className="mt-4 bg-gray-900/50 p-4 rounded-lg max-h-60 overflow-y-auto">
                        <p className="flex flex-wrap gap-x-4 gap-y-2 text-gray-400">
                            {stats.jlptWordLists[visibleList].map(word => <span key={word}>{word}</span>)}
                        </p>
                    </div>
                 )}
            </div>

            <div className="text-center pt-4">
                <button
                    onClick={onReset}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                >
                    Analisis Lagi
                </button>
            </div>
        </div>
    );
};

export default ResultsDisplay;
