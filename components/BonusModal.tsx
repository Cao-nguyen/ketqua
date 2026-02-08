import React, { useState } from 'react';
import { X, PlusCircle, History } from 'lucide-react';
import { BonusPoint } from '../types';

interface BonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: number, reason: string) => void;
  subjectName: string;
  bonusPoints: BonusPoint[];
}

const BonusModal: React.FC<BonusModalProps> = ({ isOpen, onClose, onSave, subjectName, bonusPoints }) => {
  const [value, setValue] = useState<string>('0.5');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(value);
    if (!isNaN(numVal) && numVal > 0 && reason.trim()) {
      onSave(numVal, reason);
      setReason('');
      setValue('0.5');
      // Don't close immediately if user wants to see list, but UX standard is close on save.
      // Let's keep it open? No, close is better.
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up flex flex-col max-h-[80vh]">
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h3 className="text-white font-semibold text-lg">Quản lý Điểm Cộng: {subjectName}</h3>
          <button onClick={onClose} className="text-white hover:bg-indigo-700 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pb-4 border-b border-gray-100">
            <div className="font-semibold text-gray-700 flex items-center gap-2">
                <PlusCircle size={18} className="text-indigo-600"/> Thêm điểm mới
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Số điểm</label>
                    <input
                    type="number"
                    step="0.1"
                    max="10"
                    min="0.1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
                    autoFocus
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Lí do</label>
                    <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Vd: Phát biểu..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>
            </div>
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={!reason.trim()}
                    className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                    Lưu vào kho
                </button>
            </div>
            </form>

            {/* History List */}
            <div>
                <div className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <History size={18} className="text-amber-500"/> Lịch sử điểm cộng
                </div>
                {bonusPoints.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center italic py-2">Chưa có điểm cộng nào trong kho.</p>
                ) : (
                    <div className="space-y-2">
                        {bonusPoints.map((bp) => (
                            <div key={bp.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{bp.reason}</p>
                                    <p className="text-xs text-gray-400">{new Date(bp.timestamp).toLocaleDateString('vi-VN')}</p>
                                </div>
                                <div className="bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded text-sm">
                                    +{bp.value}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default BonusModal;