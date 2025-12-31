import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPass(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPass(e.target.files);
    }
  };

  const validateAndPass = (fileList: FileList) => {
    if (isLoading) return;
    const filesArray = Array.from(fileList).filter(f => f.name.endsWith('.srt'));
    if (filesArray.length === 0) {
      alert("Harap upload file .srt yang valid.");
      return;
    }
    onFilesSelected(filesArray);
  };

  return (
    <div 
      className={`relative group rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out p-10 text-center cursor-pointer overflow-hidden
        ${dragActive ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input 
        ref={inputRef} 
        type="file" 
        multiple 
        accept=".srt" 
        className="hidden" 
        onChange={handleChange} 
      />
      
      <div className="flex flex-col items-center justify-center space-y-4 relative z-10">
        <div className={`p-4 rounded-full bg-indigo-100 text-indigo-600 transition-transform duration-300 ${dragActive ? 'scale-110' : 'group-hover:scale-110'}`}>
          <UploadCloud size={40} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            {isLoading ? "Sedang Memproses..." : "Upload Subtitle (.srt)"}
          </h3>
          <p className="text-slate-500 mt-2 text-sm max-w-sm mx-auto">
            Drag & drop file Anda di sini, atau klik untuk memilih. Bisa upload multiple file sekaligus.
          </p>
        </div>
        <div className="flex gap-2 text-xs text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
           <FileText size={14} /> Supported: UTF-8, Shift-JIS
        </div>
      </div>
    </div>
  );
};