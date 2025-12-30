
import React from 'react';

interface AnalysisInProgressProps {
    message: string;
}

const AnalysisInProgress: React.FC<AnalysisInProgressProps> = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-t-transparent border-purple-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-200">Menganalisis...</h2>
            <p className="text-gray-400 text-center">{message}</p>
        </div>
    );
};

export default AnalysisInProgress;
