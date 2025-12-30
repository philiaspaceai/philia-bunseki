
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploaderProps {
    onAnalyze: (files: File[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onAnalyze }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // Fix: Explicitly type `file` as `File` to resolve an issue where its type was inferred as `unknown`.
            const srtFiles = Array.from(e.dataTransfer.files).filter((file: File) => file.name.endsWith('.srt'));
            setFiles(srtFiles);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);
    
    const handleAnalyzeClick = () => {
        if(files.length > 0) {
            onAnalyze(files);
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-300 ${isDragging ? 'border-indigo-500 bg-gray-800' : 'border-gray-600 hover:border-indigo-500 bg-gray-800/50'}`}
            >
                <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept=".srt"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-4">
                    <UploadIcon className={`w-12 h-12 text-gray-400 transition-colors ${isDragging ? 'text-indigo-400' : ''}`} />
                    <p className="text-gray-300">
                        <span className="font-semibold text-indigo-400">Klik untuk mengunggah</span> atau seret dan lepas
                    </p>
                    <p className="text-sm text-gray-500">Hanya file SRT</p>
                </div>
            </div>

            {files.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">File yang Dipilih:</h3>
                    <ul className="space-y-2">
                        {files.map((file, index) => (
                            <li key={index} className="bg-gray-800 p-3 rounded-lg text-sm text-gray-400 truncate">
                                {file.name}
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={handleAnalyzeClick}
                        className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                        disabled={files.length === 0}
                    >
                        Analisis Sekarang
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileUploader;
