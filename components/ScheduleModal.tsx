import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Sun, Moon, Calendar, Flag, Pin } from 'lucide-react';
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
];

const PERIODS = [0, 1, 2, 3, 4];

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose }) => {
  const { weeks, addWeek, updateWeek, deleteWeek, subjects, defaultWeekId, setDefaultWeekId } = useGrade();
  const [selectedWeekId, setSelectedWeekId] = useState<string | 'new'>('new');
  const [formData, setFormData] = useState<WeekSchedule | null>(null);

  useEffect(() => {
    if (isOpen) {
        if (weeks.length > 0) {
            let weekToSelect = null;
            if (defaultWeekId) {
                weekToSelect = weeks.find(w => w.id === defaultWeekId);
            }
            if (!weekToSelect) {
                // Find week with max number to select by default
                weekToSelect = weeks.reduce((prev, current) => {
                    const prevNum = parseInt(prev.name.replace(/\D/g, '')) || 0;
                    const currNum = parseInt(current.name.replace(/\D/g, '')) || 0;
                    return currNum > prevNum ? current : prev;
                });
            }
            
            if (weekToSelect) {
                setSelectedWeekId(weekToSelect.id);
                setFormData(JSON.parse(JSON.stringify(weekToSelect)));
            }
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

    // Calculate next week number based on max existing week number
    let nextWeekNum = 1;
    if (weeks.length > 0) {
        const maxNum = Math.max(...weeks.map(w => parseInt(w.name.replace(/\D/g, '')) || 0));
        nextWeekNum = maxNum + 1;
    }

    setFormData({
        id: uuidv4(),
        name: `Tuần ${nextWeekNum}`,
        days: {
            mon: emptyDay(), tue: emptyDay(), wed: emptyDay(), thu: emptyDay(), fri: emptyDay(), sat: emptyDay()
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

  const updateFormData = (newData: WeekSchedule) => {
    setFormData(newData);
    
    // Check if this week already exists in the global state to decide between add or update
    if (selectedWeekId === 'new') {
        addWeek(newData);
        setSelectedWeekId(newData.id);
    } else {
        updateWeek(newData);
    }
  };

  const calculateNextDates = (startDate: string) => {
      const parts = startDate.split('/');
      if (parts.length !== 2) return null;
      
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      
      if (isNaN(day) || isNaN(month)) return null;

      const currentYear = new Date().getFullYear();
      const date = new Date(currentYear, month - 1, day);
      
      if (date.getDate() !== day || date.getMonth() !== month - 1) return null;

      const nextDates: Record<string, string> = {};
      const dayKeys = ['tue', 'wed', 'thu', 'fri', 'sat']; // Removed 'sun'
      
      for (let i = 0; i < dayKeys.length; i++) {
          date.setDate(date.getDate() + 1);
          const d = date.getDate().toString().padStart(2, '0');
          const m = (date.getMonth() + 1).toString().padStart(2, '0');
          nextDates[dayKeys[i]] = `${d}/${m}`;
      }
      return nextDates;
  };

  const handleCellChange = (dayKey: string, session: 'morning' | 'afternoon', index: number, field: keyof PeriodInfo, value: any) => {
    if (!formData) return;
    const newDays = { ...formData.days } as any;
    const day = newDays[dayKey] as DaySchedule;
    
    // Create new array to avoid mutation issues
    const newPeriods = [...(session === 'morning' ? day.morning : day.afternoon)];
    newPeriods[index] = { ...newPeriods[index], [field]: value };

    if (session === 'morning') day.morning = newPeriods;
    else day.afternoon = newPeriods;

    updateFormData({ ...formData, days: newDays });
  };

  const toggleMidterm = (dayKey: string, session: 'morning' | 'afternoon', index: number) => {
      if (!formData) return;
      const newDays = { ...formData.days } as any;
      const day = newDays[dayKey] as DaySchedule;
      const periods = session === 'morning' ? day.morning : day.afternoon;
      const currentVal = periods[index].isMidterm;
      
      handleCellChange(dayKey, session, index, 'isMidterm', !currentVal);
  };

  const handleDateChange = (dayKey: string, date: string) => {
      if (!formData) return;
      const newDays = { ...formData.days } as any;
      newDays[dayKey].date = date;

      // Auto-fill subsequent days if Monday is changed
      if (dayKey === 'mon') {
          const nextDates = calculateNextDates(date);
          if (nextDates) {
              Object.keys(nextDates).forEach(key => {
                  if (newDays[key]) {
                      newDays[key].date = nextDates[key];
                  }
              });
          }
      }

      updateFormData({ ...formData, days: newDays });
  };

  const handleDelete = () => {
      if (selectedWeekId !== 'new') {
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
    <div className="w-full flex flex-col animate-fade-in-up bg-white rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100/80 mb-10 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 bg-white border-b border-gray-100/50 flex flex-wrap gap-4 items-center relative z-20">
             <div className="flex items-center gap-2">
                 <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                     <Calendar size={18} strokeWidth={2.5} />
                 </div>
                 <select 
                    value={selectedWeekId} 
                    onChange={(e) => handleWeekSelect(e.target.value)}
                    className="border-0 bg-gray-50 text-gray-900 font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                 >
                     {weeks.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                     <option value="new">+ Thêm tuần mới</option>
                 </select>
             </div>

             <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

             <input 
                 type="text" 
                 value={formData.name}
                 onChange={(e) => updateFormData({...formData, name: e.target.value})}
                 placeholder="Tên tuần..."
                 className="border-0 bg-gray-50 rounded-xl px-4 py-2 w-48 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 font-medium placeholder-gray-400 hover:bg-gray-100 transition-colors"
             />

             {selectedWeekId !== 'new' && (
                 <button 
                     onClick={() => setDefaultWeekId(defaultWeekId === selectedWeekId ? null : selectedWeekId)}
                     className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-medium text-sm border ${
                         defaultWeekId === selectedWeekId 
                         ? 'bg-blue-50 border-blue-200 text-blue-700' 
                         : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                     }`}
                     title={defaultWeekId === selectedWeekId ? "Bỏ ghim tuần này" : "Mở mặc định vào tuần này"}
                 >
                     <Pin size={16} className={defaultWeekId === selectedWeekId ? "fill-blue-700" : ""} />
                     <span className="hidden sm:inline">Mặc định</span>
                 </button>
             )}

             <div className="flex-grow"></div>

             {selectedWeekId !== 'new' && (
                 <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl flex items-center gap-2 transition-all outline-none font-medium text-sm">
                     <Trash2 size={16} /> 
                     <span className="hidden sm:block text-red-500">Xóa lịch học</span>
                 </button>
             )}
        </div>

        {/* Grid Content */}
        <div className="overflow-x-auto bg-[#fafafa]/50 p-4 sm:p-6 w-full">
            <div className="min-w-[900px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-gray-100 bg-white relative z-10">
                    <div className="p-3 font-semibold text-gray-400 text-[10px] text-center flex flex-col items-center justify-center border-r border-gray-50 uppercase tracking-widest leading-tight">
                        <span className="block">Ca</span>
                        <span className="block">Học</span>
                    </div>
                    {DAYS.map((d, i) => (
                        <div key={d.key} className={`p-3 text-center flex flex-col items-center justify-center gap-1.5 ${i !== DAYS.length - 1 ? 'border-r border-gray-50' : ''}`}>
                            <span className={`font-semibold text-[13px] ${d.key === 'sat' || d.key === 'sun' ? 'text-blue-500' : 'text-gray-800'}`}>{d.label}</span>
                            <input 
                                type="text" 
                                placeholder="dd/mm" 
                                className="w-16 text-[10px] font-semibold text-center text-gray-400 bg-gray-50 hover:bg-gray-100 border-0 rounded-md px-1 py-1 focus:bg-blue-50 focus:text-blue-600 outline-none transition-colors placeholder-gray-300"
                                value={(formData.days as any)[d.key].date}
                                onChange={(e) => handleDateChange(d.key, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
                
                {/* Body Content */}
                <div className="flex flex-col bg-white">
                    {/* Morning */}
                    <div className="flex flex-col border-b-2 border-dashed border-gray-100">
                        <div className="py-2.5 px-4 flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest bg-[#fffdf0] sticky left-0 border-b border-[#feebc8]/50">
                            <Sun size={14} className="text-amber-500" /> Sáng
                        </div>
                        {PERIODS.map(pIndex => (
                            <div key={`m-${pIndex}`} className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition">
                                 <div className="flex items-center justify-center font-bold text-gray-300 text-xs border-r border-gray-50">
                                     {pIndex + 1}
                                 </div>
                                 {DAYS.map((d, i) => {
                                     const period = (formData.days as any)[d.key].morning[pIndex];
                                     const hasContent = period.subjectName.trim().length > 0;
                                     return (
                                         <div key={`m-${d.key}-${pIndex}`} className={`p-1.5 h-14 relative group ${i !== DAYS.length - 1 ? 'border-r border-gray-50' : ''}`}>
                                             <div className={`w-full h-full rounded-lg transition-all flex items-center ${hasContent ? (period.isMidterm ? 'bg-red-50/80 border border-red-100' : 'bg-amber-50/60 border border-amber-100/50') : 'hover:bg-gray-50'}`}>
                                                 <input 
                                                    list="subjects"
                                                    placeholder="-"
                                                    className={`w-full h-full text-center text-[13px] font-semibold bg-transparent rounded-lg outline-none transition ${
                                                        period.isMidterm 
                                                        ? 'text-red-700 placeholder-red-300' 
                                                        : hasContent ? 'text-[#b45309]' : 'text-gray-900 placeholder-gray-200'
                                                    }`}
                                                    value={period.subjectName}
                                                    onChange={(e) => handleCellChange(d.key, 'morning', pIndex, 'subjectName', e.target.value)}
                                                 />
                                             </div>
                                             <button 
                                                onClick={() => toggleMidterm(d.key, 'morning', pIndex)}
                                                className={`absolute -top-1 -right-1 p-1 rounded-full bg-white shadow-sm border transition-all z-10 scale-90 sm:scale-100 ${
                                                    period.isMidterm ? 'opacity-100 text-red-500 border-red-200' : 'opacity-0 group-hover:opacity-100 text-gray-300 border-gray-100 hover:text-red-400 hover:border-red-100'
                                                }`}
                                                title="Đánh dấu kiểm tra (nhấn lại để hủy)"
                                             >
                                                 <Flag size={10} strokeWidth={period.isMidterm ? 3 : 2} fill={period.isMidterm ? "currentColor" : "none"} />
                                             </button>
                                         </div>
                                     );
                                 })}
                            </div>
                        ))}
                    </div>

                    {/* Afternoon */}
                    <div className="flex flex-col">
                        <div className="py-2.5 px-4 flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-widest bg-[#f8faff] sticky left-0 border-b border-indigo-50/50">
                            <Moon size={14} className="text-indigo-400" /> Chiều
                        </div>
                        {PERIODS.map(pIndex => (
                            <div key={`a-${pIndex}`} className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition">
                                 <div className="flex items-center justify-center font-bold text-gray-300 text-xs border-r border-gray-50">
                                     {pIndex + 1}
                                 </div>
                                 {DAYS.map((d, i) => {
                                     const period = (formData.days as any)[d.key].afternoon[pIndex];
                                     const hasContent = period.subjectName.trim().length > 0;
                                     return (
                                         <div key={`a-${d.key}-${pIndex}`} className={`p-1.5 h-14 relative group ${i !== DAYS.length - 1 ? 'border-r border-gray-50' : ''}`}>
                                             <div className={`w-full h-full rounded-lg transition-all flex items-center ${hasContent ? (period.isMidterm ? 'bg-red-50/80 border border-red-100' : 'bg-indigo-50/60 border border-indigo-100/50') : 'hover:bg-gray-50'}`}>
                                                 <input 
                                                    list="subjects"
                                                    placeholder="-"
                                                    className={`w-full h-full text-center text-[13px] font-semibold bg-transparent rounded-lg outline-none transition ${
                                                        period.isMidterm 
                                                        ? 'text-red-700 placeholder-red-300' 
                                                        : hasContent ? 'text-indigo-700' : 'text-gray-900 placeholder-gray-200'
                                                    }`}
                                                    value={period.subjectName}
                                                    onChange={(e) => handleCellChange(d.key, 'afternoon', pIndex, 'subjectName', e.target.value)}
                                                 />
                                             </div>
                                             <button 
                                                onClick={() => toggleMidterm(d.key, 'afternoon', pIndex)}
                                                className={`absolute -top-1 -right-1 p-1 rounded-full bg-white shadow-sm border transition-all z-10 scale-90 sm:scale-100 ${
                                                    period.isMidterm ? 'opacity-100 text-red-500 border-red-200' : 'opacity-0 group-hover:opacity-100 text-gray-300 border-gray-100 hover:text-red-400 hover:border-red-100'
                                                }`}
                                                title="Đánh dấu kiểm tra (nhấn lại để hủy)"
                                             >
                                                 <Flag size={10} strokeWidth={period.isMidterm ? 3 : 2} fill={period.isMidterm ? "currentColor" : "none"} />
                                             </button>
                                         </div>
                                     );
                                 })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <datalist id="subjects">
            {subjects.map(s => <option key={s.id} value={s.name} />)}
        </datalist>

    </div>
  );
};

export default ScheduleModal;