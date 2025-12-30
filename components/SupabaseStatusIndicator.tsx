
import React from 'react';

interface SupabaseStatusIndicatorProps {
    status: 'checking' | 'connected' | 'error';
}

const SupabaseStatusIndicator: React.FC<SupabaseStatusIndicatorProps> = ({ status }) => {
    const statusConfig = {
        checking: {
            color: 'bg-yellow-500 animate-pulse',
            title: 'Memeriksa koneksi Supabase...',
        },
        connected: {
            color: 'bg-green-500',
            title: 'Koneksi Supabase berhasil',
        },
        error: {
            color: 'bg-red-500',
            title: 'Koneksi Supabase gagal',
        },
    };

    return (
        <div 
            className="flex items-center space-x-2"
            title={statusConfig[status].title}
        >
            <div className={`w-3 h-3 rounded-full ${statusConfig[status].color} transition-colors duration-300`}></div>
        </div>
    );
};

export default SupabaseStatusIndicator;
