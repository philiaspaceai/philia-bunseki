import React, { useEffect, useState } from 'react';
import { getAllResults, deleteResult } from '../lib/db';
import { AnalysisResult } from '../types';
import { Card, Button } from './ui/UIComponents';
import { Modal } from './ui/Modal';
import { Trash2, BarChart2 } from 'lucide-react';
import { getRatingColor, getRatingLabel, getBadgeStyle } from '../constants';

interface HistoryListProps {
  onSelect: (result: AnalysisResult) => void;
  onCompare: (results: AnalysisResult[]) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ onSelect, onCompare }) => {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modal States
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const load = async () => {
    const data = await getAllResults();
    // Sort by newest
    setHistory(data.sort((a, b) => b.timestamp - a.timestamp));
  };

  useEffect(() => { load(); }, []);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
        await deleteResult(deleteConfirmId);
        if (selectedIds.has(deleteConfirmId)) {
            const newSet = new Set(selectedIds);
            newSet.delete(deleteConfirmId);
            setSelectedIds(newSet);
        }
        await load();
        setDeleteConfirmId(null);
    }
  };

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
        newSet.delete(id);
        setSelectedIds(newSet);
    } else if (newSet.size < 3) {
        newSet.add(id);
        setSelectedIds(newSet);
    } else {
        setAlertMessage("You can only select up to 3 items for comparison.");
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Analysis History</h2>
        {selectedIds.size >= 2 && (
            <Button onClick={() => onCompare(history.filter(h => selectedIds.has(h.id)))} variant="secondary" className="gap-2">
                <BarChart2 size={16} /> Compare ({selectedIds.size})
            </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map(item => (
          <Card 
            key={item.id} 
            className={`cursor-pointer hover:border-primary transition-colors relative group ${selectedIds.has(item.id) ? 'ring-2 ring-primary border-primary' : ''}`}
            onClick={() => onSelect(item)}
          >
             <div className="absolute top-4 right-4 flex gap-2">
                <button 
                    onClick={(e) => toggleSelection(e, item.id)}
                    className={`w-6 h-6 rounded border flex items-center justify-center ${selectedIds.has(item.id) ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:border-primary'}`}
                    aria-label="Select for comparison"
                >
                    {selectedIds.has(item.id) && <span className="text-xs">✓</span>}
                </button>
                <button 
                    onClick={(e) => handleDeleteClick(e, item.id)} 
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete result"
                >
                    <Trash2 size={16} />
                </button>
             </div>

             <h3 className="font-semibold text-lg truncate pr-8 mb-1">{item.animeName}</h3>
             <p className="text-xs text-gray-400 mb-4">{new Date(item.timestamp).toLocaleDateString()}</p>
             
             <div className="flex items-center gap-2">
                <span className={`text-3xl font-black ${getRatingColor(item.difficultyScore)}`}>{item.difficultyScore}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getBadgeStyle(item.difficultyScore)}`}>
                    {getRatingLabel(item.difficultyScore)}
                </span>
             </div>
          </Card>
        ))}
        {history.length === 0 && <p className="text-gray-500 col-span-full text-center py-8">No history yet.</p>}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!deleteConfirmId} 
        onClose={() => setDeleteConfirmId(null)} 
        title="Delete Record"
        type="danger"
        footer={
            <>
                <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                <Button className="bg-red-500 hover:bg-red-600" onClick={confirmDelete}>Delete</Button>
            </>
        }
      >
        <p>Are you sure you want to delete this analysis result? This action cannot be undone.</p>
      </Modal>

      {/* Alert Modal */}
      <Modal 
        isOpen={!!alertMessage} 
        onClose={() => setAlertMessage(null)} 
        title="Limit Reached"
        footer={
            <Button onClick={() => setAlertMessage(null)}>OK</Button>
        }
      >
        <p>{alertMessage}</p>
      </Modal>

    </div>
  );
};