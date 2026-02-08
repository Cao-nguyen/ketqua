import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Wand2, Calendar } from 'lucide-react';
import { Grade, GradeType, WeekSchedule, DaySchedule } from '../types';
import { useGrade } from '../context/GradeContext';

interface GradeInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: number, reason: string) => void;
  onDelete?: () => void;
  onUseBonus?: (amount: number) => void;
  initialData?: Grade | null;
  gradeType: GradeType;
  subjectName: string;
  maxBonusAvailable: number;
}

const DAYS = [
    { key: 'mon', label: 'T2' },
    { key: 'tue', label: 'T3' },
    { key: 'wed', label: 'T4' },
    { key: 'thu', label: 'T5' },
    { key: 'fri', label: 'T6' },
    { key: 'sat', label: 'T7' },
    { key: 'sun', label: 'CN' },
];

const GradeInputModal: React.FC<GradeInputModalProps> = ({ 
  isOpen, onClose, onSave, onDelete, onUseBonus, initialData, gradeType, subjectName, maxBonusAvailable 
}) => {
  const { weeks } = useGrade();
  const [value, setValue] = useState<string>('');
  const [reason, setReason] = useState('');
  const [bonusToUse, setBonusToUse] = useState<string>('0');
  const [showBonusInput, setShowBonusInput] = useState(false);
  
  // Schedule Selection State
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedWeekId, setSelectedWeekId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setValue(initialData.value.toString());
        setReason(initialData.reason);
      } else {
        setValue('');
        setReason('');
      }
      setShowBonusInput(false);
      setBonusToUse('0');
      setShowSchedule(false);
      if (weeks.length > 0) setSelectedWeekId(weeks[0].id);
    }
  }, [isOpen, initialData, weeks]);

  if (!isOpen) return null;

  const getTitle = () => {
    const typeMap = {
      [GradeType.REGULAR]: 'Thường Xuyên',
      [GradeType.MIDTERM]: 'Giữa Kì (x2)',
      [GradeType.FINAL]: 'Cuối Kì (x3)',
    };
    return initialData ? `Sửa Điểm ${typeMap[gradeType]}` : `Nhập Điểm ${typeMap[gradeType]}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(value);
    if (!isNaN(numVal) && numVal >= 0 && numVal <= 10 && reason.trim()) {
      onSave(numVal, reason);
      onClose();
    }
  };

  const handleApplyBonus = () => {
    const amount = parseFloat(bonusToUse);
    if (onUseBonus && !isNaN(amount) && amount > 0 && amount <= maxBonusAvailable) {
        onUseBonus(amount);
        onClose();
    }
  };

  const handleSelectSlot = (dayKey: string, dayLabel: string, date: string, periodIndex: number, session: 'Sáng' | 'Chiều') => {
      const selectedWeek = weeks.find(w => w.id === selectedWeekId);
      const weekName = selectedWeek ? selectedWeek.name : '';
      
      const newReason = `${dayLabel}, ngày ${date} - ${weekName} - ${session} Tiết ${periodIndex + 1}`;
      
      setReason(newReason);
      setShowSchedule(false);
  };

  const renderSchedule = () => {
      const week = weeks.find(w => w.id === selectedWeekId);
      if (!week) return <div className="text-center p-4 text-gray-500">Chưa có dữ liệu thời khóa biểu.</div>;

      return (
          <div className="overflow-auto max-h-[300px] border border-gray-200 rounded-lg mt-2">
              <table className="w-full text-xs">
                  <thead className="bg-gray-100 sticky top-0">
                      <tr>
                          <th className="p-2 border-r text-gray-700">Tiết</th>
                          {DAYS.map(d => (
                              <th key={d.key} className="p-2 border-r min-w-[80px] text-gray-800">
                                  {d.label}<br/><span className="font-normal text-gray-500">{(week.days as any)[d.key].date}</span>
                              </th>
                          ))}
                      </tr>
                  </thead>
                  <tbody>
                      {/* Morning */}
                      {[0,1,2,3,4].map(idx => (
                          <tr key={`m-${idx}`} className="border-b">
                              <td className="p-2 text-center font-bold text-gray-400 bg-gray-50">{idx+1} (S)</td>
                              {DAYS.map(d => {
                                  const cell = (week.days as any)[d.key].morning[idx];
                                  const isTarget = cell.subjectName === subjectName;
                                  return (
                                      <td 
                                        key={`m-${d.key}`} 
                                        className={`p-2 border-r cursor-pointer hover:bg-indigo-100 transition text-center h-10 ${isTarget ? 'bg-indigo-50 border-indigo-200' : ''}`}
                                        onClick={() => handleSelectSlot(d.key, d.label, (week.days as any)[d.key].date, idx, 'Sáng')}
                                      >
                                          <div className={`font-semibold ${isTarget ? 'text-indigo-700' : 'text-gray-800'}`}>{cell.subjectName}</div>
                                      </td>
                                  );
                              })}
                          </tr>
                      ))}
                      {/* Afternoon */}
                      {[0,1,2,3,4].map(idx => (
                          <tr key={`a-${idx}`} className="border-b">
                              <td className="p-2 text-center font-bold text-gray-400 bg-gray-50">{idx+1} (C)</td>
                              {DAYS.map(d => {
                                  const cell = (week.days as any)[d.key].afternoon[idx];
                                  const isTarget = cell.subjectName === subjectName;
                                  return (
                                      <td 
                                        key={`a-${d.key}`} 
                                        className={`p-2 border-r cursor-pointer hover:bg-indigo-100 transition text-center h-10 ${isTarget ? 'bg-indigo-50 border-indigo-200' : ''}`}
                                        onClick={() => handleSelectSlot(d.key, d.label, (week.days as any)[d.key].date, idx, 'Chiều')}
                                      >
                                          <div className={`font-semibold ${isTarget ? 'text-indigo-700' : 'text-gray-800'}`}>{cell.subjectName}</div>
                                      </td>
                                  );
                              })}
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-white font-semibold text-lg">{getTitle()}</h3>
            <p className="text-indigo-200 text-xs">{subjectName}</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-indigo-700 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {!showBonusInput ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Điểm số (0-10)</label>
                    <input
                      type="number"
                      step="0.01"
                      max="10"
                      min="0"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg font-mono text-gray-900 bg-white"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="flex items-end">
                      <button 
                        type="button" 
                        onClick={() => setShowSchedule(!showSchedule)}
                        className={`w-full py-2 px-3 rounded-lg border border-indigo-200 text-sm font-medium flex items-center justify-center gap-2 transition ${showSchedule ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                          <Calendar size={16} /> 
                          {showSchedule ? 'Ẩn TKB' : 'Chọn từ TKB'}
                      </button>
                  </div>
              </div>

              {showSchedule && (
                  <div className="animate-fade-in border-t pt-4">
                       <div className="flex justify-between items-center mb-2">
                           <label className="text-sm font-semibold text-gray-700">Chọn buổi học:</label>
                           <select 
                                value={selectedWeekId} 
                                onChange={(e) => setSelectedWeekId(e.target.value)}
                                className="text-sm border rounded px-2 py-1 bg-white text-gray-900"
                           >
                               {weeks.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                           </select>
                       </div>
                       {renderSchedule()}
                  </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lí do có điểm</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Vd: Kiểm tra 15p, Thi viết..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 h-20 resize-none text-gray-900 bg-white placeholder-gray-400"
                  required
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <div>
                   {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={() => {
                            if(window.confirm('Bạn có chắc chắn muốn xóa điểm này?')) {
                                onDelete();
                                onClose();
                            }
                        }}
                        className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded"
                    >
                        <Trash2 size={16} /> Xóa
                    </button>
                   )}
                </div>
                <div className="flex gap-2">
                   {initialData && maxBonusAvailable > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowBonusInput(true)}
                            className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition"
                        >
                            <Wand2 size={16} /> Bù điểm
                        </button>
                   )}
                    <button
                        type="submit"
                        disabled={!value || !reason.trim()}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                    >
                        <Save size={18} /> Lưu
                    </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4 animate-fade-in">
                 <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-amber-800 text-sm font-medium">Kho điểm cộng: {maxBonusAvailable.toFixed(2)}</p>
                    <p className="text-amber-600 text-xs mt-1">Sử dụng điểm cộng để tăng điểm số hiện tại ({value}).</p>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cộng thêm bao nhiêu?</label>
                    <input
                        type="number"
                        step="0.1"
                        max={maxBonusAvailable}
                        min="0.1"
                        value={bonusToUse}
                        onChange={(e) => setBonusToUse(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-gray-900 bg-white"
                    />
                 </div>

                 <div className="flex justify-end gap-2 pt-2">
                    <button 
                        onClick={() => setShowBonusInput(false)}
                        className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg"
                    >
                        Quay lại
                    </button>
                    <button
                        onClick={handleApplyBonus}
                        disabled={parseFloat(bonusToUse) <= 0 || parseFloat(bonusToUse) > maxBonusAvailable}
                        className="bg-amber-500 text-white hover:bg-amber-600 px-4 py-2 rounded-lg flex items-center gap-1 disabled:opacity-50 transition"
                    >
                        <Wand2 size={16} /> Xác nhận bù
                    </button>
                 </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradeInputModal;