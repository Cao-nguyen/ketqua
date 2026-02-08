import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Sun, Moon, Calendar } from 'lucide-react';
import { WeekSchedule, DaySchedule, PeriodInfo } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useGrade } from '../context/GradeContext';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAYS = [
    { key: 'mon', label: 'Thứ 2' },
    { key: 'tue', label: 'Thứ 3' },
    { key: 'wed', label: 'Thứ 4' },
    { key: 'thu', label: 'Thứ 5' },
    { key: 'fri', label: 'Thứ 6' },
    { key: 'sat', label: 'Thứ 7' },
    { key: 'sun', label: 'CN' },
];

const PERIODS = [0, 1, 2, 3, 4];

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose }) => {
  const { weeks, addWeek, updateWeek, deleteWeek, subjects } = useGrade();
  const [selectedWeekId, setSelectedWeekId] = useState<string | 'new'>('new');
  const [formData, setFormData] = useState<WeekSchedule | null>(null);

  useEffect(() => {
    if (isOpen) {
        if (weeks.length > 0) {
            setSelectedWeekId(weeks[0].id);
            setFormData(weeks[0]);
        } else {
            initNewWeek();
        }
    }
  }, [isOpen]);

  const initNewWeek = () => {
    setSelectedWeekId('new');
    const emptyDay = (): DaySchedule => ({ 
        date: '', 
        morning: Array(5).fill({ subjectName: '', teacherName: '' }), 
        afternoon: Array(5).fill({ subjectName: '', teacherName: '' }) 
    });
    setFormData({
        id: uuidv4(),
        name: `Tuần ${weeks.length + 1}`,
        days: {
            mon: emptyDay(), tue: emptyDay(), wed: emptyDay(), thu: emptyDay(), fri: emptyDay(), sat: emptyDay(), sun: emptyDay()
        }
    });
  };

  const handleWeekSelect = (id: string) => {
    if (id === 'new') {
        initNewWeek();
    } else {
        const w = weeks.find(wk => wk.id === id);
        if (w) {
            setSelectedWeekId(id);
            setFormData(JSON.parse(JSON.stringify(w))); // Deep copy
        }
    }
  };

  const handleCellChange = (dayKey: string, session: 'morning' | 'afternoon', index: number, field: keyof PeriodInfo, value: string) => {
    if (!formData) return;
    const newDays = { ...formData.days } as any;
    const day = newDays[dayKey] as DaySchedule;
    
    // Create new array to avoid mutation issues
    const newPeriods = [...(session === 'morning' ? day.morning : day.afternoon)];
    newPeriods[index] = { ...newPeriods[index], [field]: value };

    if (session === 'morning') day.morning = newPeriods;
    else day.afternoon = newPeriods;

    setFormData({ ...formData, days: newDays });
  };

  const handleDateChange = (dayKey: string, date: string) => {
      if (!formData) return;
      const newDays = { ...formData.days } as any;
      newDays[dayKey].date = date;
      setFormData({ ...formData, days: newDays });
  };

  const handleSave = () => {
      if (!formData) return;
      if (selectedWeekId === 'new') {
          addWeek(formData);
          setSelectedWeekId(formData.id);
      } else {
          updateWeek(formData);
      }
      alert('Đã lưu thời khóa biểu!');
  };

  const handleDelete = () => {
      if (selectedWeekId !== 'new' && window.confirm('Xóa tuần này?')) {
          deleteWeek(selectedWeekId);
          if (weeks.length > 1) {
             const others = weeks.filter(w => w.id !== selectedWeekId);
             if (others.length > 0) handleWeekSelect(others[0].id);
             else initNewWeek();
          } else {
             initNewWeek();
          }
      }
  };

  if (!isOpen || !formData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl h-[90vh] flex flex-col animate-fade-in-up overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2 text-white">
            <Calendar size={24} />
            <h3 className="font-semibold text-lg">Quản lý Thời Khóa Biểu</h3>
          </div>
          <button onClick={onClose} className="text-white hover:bg-indigo-700 p-2 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-white border-b border-gray-200 flex flex-wrap gap-4 items-center flex-shrink-0 shadow-sm z-20">
             <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-gray-500">Chọn tuần:</span>
                 <select 
                    value={selectedWeekId} 
                    onChange={(e) => handleWeekSelect(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                 >
                     {weeks.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                     <option value="new">+ Thêm tuần mới</option>
                 </select>
             </div>

             <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Tên tuần (vd: Tuần 1)"
                className="border border-gray-300 rounded-lg px-3 py-2 w-48 focus:ring-2 focus:ring-indigo-500 outline-none"
             />

             <div className="flex-grow"></div>

             {selectedWeekId !== 'new' && (
                 <button onClick={handleDelete} className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg flex items-center gap-2 transition">
                     <Trash2 size={18} /> <span className="hidden sm:inline">Xóa tuần</span>
                 </button>
             )}
             <button onClick={handleSave} className="bg-indigo-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-md transition transform active:scale-95">
                 <Save size={18} /> Lưu Thay Đổi
             </button>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
            <div className="min-w-[1000px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-100">
                    <div className="p-4 font-bold text-gray-500 text-center flex items-center justify-center border-r border-gray-200">
                        Tiết
                    </div>
                    {DAYS.map(d => (
                        <div key={d.key} className="p-3 border-r border-gray-200 last:border-r-0 text-center">
                            <div className="font-bold text-gray-800 mb-1">{d.label}</div>
                            <input 
                                type="text" 
                                placeholder="dd/mm" 
                                className="w-20 text-xs text-center bg-white border border-gray-300 rounded px-1 py-0.5 focus:border-indigo-500 outline-none"
                                value={(formData.days as any)[d.key].date}
                                onChange={(e) => handleDateChange(d.key, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
                
                {/* Morning Section */}
                <div className="bg-orange-50/30">
                    <div className="py-2 px-4 flex items-center gap-2 text-orange-600 font-bold text-sm border-b border-orange-100 bg-orange-50">
                        <Sun size={16} /> BUỔI SÁNG
                    </div>
                    {PERIODS.map(pIndex => (
                        <div key={`m-${pIndex}`} className="grid grid-cols-8 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition">
                             <div className="flex items-center justify-center font-bold text-gray-400 border-r border-gray-100 bg-gray-50/50">
                                 {pIndex + 1}
                             </div>
                             {DAYS.map(d => {
                                 const period = (formData.days as any)[d.key].morning[pIndex];
                                 return (
                                     <div key={`m-${d.key}-${pIndex}`} className="p-2 border-r border-gray-100 last:border-r-0 h-16 relative group">
                                         <input 
                                            list="subjects"
                                            placeholder="-"
                                            className="w-full h-full text-center font-medium text-gray-700 bg-transparent rounded-md outline-none focus:bg-indigo-50 focus:text-indigo-700 placeholder-gray-300 transition"
                                            value={period.subjectName}
                                            onChange={(e) => handleCellChange(d.key, 'morning', pIndex, 'subjectName', e.target.value)}
                                         />
                                     </div>
                                 );
                             })}
                        </div>
                    ))}
                </div>

                {/* Afternoon Section */}
                <div className="bg-indigo-50/30 border-t border-gray-200">
                    <div className="py-2 px-4 flex items-center gap-2 text-indigo-600 font-bold text-sm border-b border-indigo-100 bg-indigo-50">
                        <Moon size={16} /> BUỔI CHIỀU
                    </div>
                     {PERIODS.map(pIndex => (
                        <div key={`a-${pIndex}`} className="grid grid-cols-8 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition">
                             <div className="flex items-center justify-center font-bold text-gray-400 border-r border-gray-100 bg-gray-50/50">
                                 {pIndex + 1}
                             </div>
                             {DAYS.map(d => {
                                 const period = (formData.days as any)[d.key].afternoon[pIndex];
                                 return (
                                     <div key={`a-${d.key}-${pIndex}`} className="p-2 border-r border-gray-100 last:border-r-0 h-16 relative group">
                                         <input 
                                            list="subjects"
                                            placeholder="-"
                                            className="w-full h-full text-center font-medium text-gray-700 bg-transparent rounded-md outline-none focus:bg-indigo-50 focus:text-indigo-700 placeholder-gray-300 transition"
                                            value={period.subjectName}
                                            onChange={(e) => handleCellChange(d.key, 'afternoon', pIndex, 'subjectName', e.target.value)}
                                         />
                                     </div>
                                 );
                             })}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <datalist id="subjects">
            {subjects.map(s => <option key={s.id} value={s.name} />)}
        </datalist>

      </div>
    </div>
  );
};

export default ScheduleModal;