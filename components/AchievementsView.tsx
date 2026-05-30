import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGrade } from '../context/GradeContext';
import { Achievement } from '../types';
import { Plus, Trophy, Medal, Award, Edit2, Trash2 } from 'lucide-react';

const AchievementsView: React.FC = () => {
    const { achievements, addAchievement, updateAchievement, deleteAchievement } = useGrade();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);

    const handleOpenAdd = () => {
        setEditingAchievement(null);
        setIsAddModalOpen(true);
    };

    const handleOpenEdit = (ach: Achievement) => {
        setEditingAchievement(ach);
        setIsAddModalOpen(true);
    };

    const viewAnimateState = {
        opacity: 1,
        scale: 1,
        y: 0
    };
      
    const emptyViewState = {
        opacity: 0,
        scale: 0.95,
        y: 10
    };

    return (
        <motion.div 
            initial={emptyViewState}
            animate={viewAnimateState}
            exit={emptyViewState}
            className="flex flex-col min-h-full pb-24"
        >
            <div className="px-6 pt-12 pb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Thành Tích</h1>
                    <p className="text-gray-500 mt-2">Ghi nhận các giải thưởng và cuộc thi.</p>
                </div>
                <button 
                  onClick={handleOpenAdd}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-2xl shadow-sm transition-all focus:ring-4 focus:ring-yellow-100 flex items-center gap-2"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline font-medium">Thêm thành tích</span>
                </button>
            </div>

            <div className="px-4">
                <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100/80">
                    {achievements.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="bg-yellow-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Trophy className="text-yellow-500" size={24} />
                            </div>
                            <p className="text-gray-500">Chưa có thành tích nào. Hãy thêm vào nhé!</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {[...achievements].sort((a,b) => b.timestamp - a.timestamp).map(ach => (
                                <div key={ach.id} className="flex flex-col p-5 bg-gray-50/50 hover:bg-yellow-50/30 rounded-2xl border border-gray-100 transition-colors group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
                                                {ach.prize.toLowerCase().includes('nhất') ? <Trophy size={24} /> : 
                                                 ach.prize.toLowerCase().includes('nhì') ? <Medal size={24} /> : 
                                                 ach.prize.toLowerCase().includes('ba') ? <Award size={24} /> : 
                                                 <Medal size={24} />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{ach.prize}</h3>
                                                <p className="text-sm font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100 w-fit mt-1">
                                                    {ach.level}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenEdit(ach)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => deleteAchievement(ach.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-auto">
                                        <p className="text-gray-700 font-medium">{ach.competition}</p>
                                        <p className="text-xs text-gray-400 mt-2">{new Date(ach.timestamp).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isAddModalOpen && (
                    <AchievementModal
                        isOpen={isAddModalOpen}
                        onClose={() => setIsAddModalOpen(false)}
                        initialData={editingAchievement}
                        onSave={(achData) => {
                            if (editingAchievement) {
                                updateAchievement({ ...editingAchievement, ...achData });
                            } else {
                                addAchievement(achData);
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AchievementsView;

interface AchievementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (ach: Omit<Achievement, 'id' | 'timestamp'>) => void;
    initialData: Achievement | null;
}

const AchievementModal: React.FC<AchievementModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [prize, setPrize] = useState(initialData?.prize || '');
    const [competition, setCompetition] = useState(initialData?.competition || '');
    const [level, setLevel] = useState(initialData?.level || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prize.trim() && competition.trim() && level.trim()) {
            onSave({
                prize: prize.trim(),
                competition: competition.trim(),
                level: level.trim()
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-lg">
                        {initialData ? 'Sửa thành tích' : 'Thêm thành tích'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                        ✕
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <form id="ach-form" onSubmit={handleSubmit} className="space-y-5">
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Giải thưởng</label>
                            <input 
                                type="text" 
                                required
                                value={prize}
                                onChange={(e) => setPrize(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all text-gray-900"
                                placeholder="VD: Giải Nhất, Huy Chương Vàng..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tên cuộc thi</label>
                            <input 
                                type="text" 
                                required
                                value={competition}
                                onChange={(e) => setCompetition(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all text-gray-900"
                                placeholder="VD: Kì thi Học sinh giỏi môn Toán..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Cấp thi</label>
                            <input 
                                type="text" 
                                required
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all text-gray-900"
                                placeholder="VD: Cấp Trường, Cấp Tỉnh, Quốc Gia..."
                            />
                        </div>

                    </form>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        Hủy
                    </button>
                    <button 
                        type="submit" 
                        form="ach-form"
                        className="px-5 py-2.5 rounded-xl font-medium text-white bg-yellow-500 hover:bg-yellow-600 shadow-sm transition-colors"
                    >
                        {initialData ? 'Cập nhật' : 'Lưu lại'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
