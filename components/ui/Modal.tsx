import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  type?: 'default' | 'danger';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, type = 'default' }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print" onClick={onClose}>
      <div 
        className="bg-white dark:bg-card border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-md transform animate-scale-in flex flex-col max-h-[90vh] overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50/50 dark:bg-slate-900/50">
          <h3 className={`text-xl font-bold ${type === 'danger' ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-90"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 text-gray-600 dark:text-gray-300 overflow-y-auto">
          {children}
        </div>
        
        {footer && (
          <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-b-2xl border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};