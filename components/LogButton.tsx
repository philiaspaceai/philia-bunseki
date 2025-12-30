
import React from 'react';
import { logger } from '../services/logger';

const LogButton: React.FC = () => {
    const handleDownload = () => {
        logger.downloadLogs();
    };

    return (
        <button
            onClick={handleDownload}
            title="Unduh Log"
            aria-label="Unduh Log"
            className="px-4 py-1.5 bg-gray-800/50 rounded-full text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200"
        >
            Log
        </button>
    );
};

export default LogButton;
