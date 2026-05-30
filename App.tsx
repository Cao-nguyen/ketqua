import React, { useState } from 'react';
import { GradeProvider, useGrade, calculateTBM, parseGradeString } from './context/GradeContext';
import SubjectRow from './components/SubjectRow';
import StatsBoard from './components/StatsBoard';
import ScheduleModal from './components/ScheduleModal';
import { Plus, GraduationCap, CalendarDays, Target, BarChart2, Wallet, Settings, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatsView from './components/StatsView';
import FinanceView from './components/FinanceView';
import AchievementsView from './components/AchievementsView';

const emptyViewState = {
  opacity: 0,
  scale: 0.98
};

const viewAnimateState = {
  opacity: 1,
  scale: 1
};

const EmptyView: React.FC<{ title: string, description: string }> = ({ title, description }) => (
  <motion.div 
    initial={emptyViewState}
    animate={viewAnimateState}
    exit={emptyViewState}
    className="flex flex-col min-h-full pb-24 items-center justify-center pt-32"
  >
    <div className="text-center px-4">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500">{description}</p>
      <div className="mt-8 text-gray-300">
         [ Tính năng đang được phát triển ]
      </div>
    </div>
  </motion.div>
);

const GoalsView: React.FC = () => {
    const { subjects, updateSubject, activeSemester, setActiveSemester } = useGrade();
    
    return (
      <motion.div 
        initial={emptyViewState}
        animate={viewAnimateState}
        exit={emptyViewState}
        className="flex flex-col min-h-full pb-24"
      >
        <div className="px-6 pt-12 pb-4 flex justify-between items-end">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mục tiêu</h1>
          <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                  onClick={() => setActiveSemester('HK1')}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${activeSemester === 'HK1' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  HK1
              </button>
              <button 
                  onClick={() => setActiveSemester('HK2')}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${activeSemester === 'HK2' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  HK2
              </button>
          </div>
        </div>
  
        <div className="px-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100 text-sm text-gray-500 font-semibold tracking-wide">
                          <th className="p-4 whitespace-nowrap sticky left-0 bg-gray-50/80 z-10 w-40 drop-shadow-[2px_0_4px_rgba(0,0,0,0.02)]">Môn học</th>
                          <th className="p-4 whitespace-nowrap text-center">Thường xuyên</th>
                          <th className="p-4 whitespace-nowrap text-center">Giữa kỳ</th>
                          <th className="p-4 whitespace-nowrap text-center">Cuối kỳ</th>
                          <th className="p-4 whitespace-nowrap text-center w-32 border-l border-gray-100 bg-blue-50/30 text-blue-700 font-bold">TBM Mục tiêu</th>
                          <th className="p-4 whitespace-nowrap text-center w-32 bg-gray-50/50 text-gray-700 font-bold">TBM Thực tế</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {subjects.map((sub) => {
                          const isHk1 = activeSemester === 'HK1';
                          
                          // Calculate Actual
                          const actualReg = isHk1 ? (sub.regularGrades1 || []) : sub.regularGrades;
                          const actualMid = isHk1 ? sub.midtermGrade1 : sub.midtermGrade;
                          const actualFin = isHk1 ? sub.finalGrade1 : sub.finalGrade;
                          const actualTBMCalc = calculateTBM(actualReg.map(g=>g.value), actualMid?.value ?? null, actualFin?.value ?? null);
                          const actualTBM = isHk1 && actualTBMCalc === 0 ? (sub.semester1Average || 0) : actualTBMCalc;

                          // Goals Parsing & Calculation
                          const goalRegStr = isHk1 ? sub.goalRegular1 : sub.goalRegular2;
                          const goalMidStr = isHk1 ? sub.goalMidterm1 : sub.goalMidterm2;
                          const goalFinStr = isHk1 ? sub.goalFinal1 : sub.goalFinal2;

                          const goalReg = parseGradeString(goalRegStr);
                          const goalMid = goalMidStr ? parseFloat(goalMidStr) : null;
                          const goalFin = goalFinStr ? parseFloat(goalFinStr) : null;

                          // The user can override targetTBM manually, or we calculate it. 
                          // If they enter specific detailed goals, we calculate Target TBM.
                          // Wait, since they want it "như điểm số luôn á", we auto-calculate the target TBM dynamically.
                          
                          let targetTBM = calculateTBM(goalReg, goalMid, goalFin);
                          // If targetTBM is 0 because no detailed inputs, we fall back to manual TargetTBM fallback if it exists.
                          const hasDetailedInputs = goalReg.length > 0 || goalMid !== null || goalFin !== null;
                          if (!hasDetailedInputs) {
                              targetTBM = (isHk1 ? sub.targetTBM1 : sub.targetTBM2) || 0;
                          }

                          // Comparison Difference
                          // "Khi điểm mục tiêu lớn hơn điểm chính thì hiển thị màu xanh + lớn hơn bao nhiêu, ngược lại hiện màu đỏ + nhỏ hơn bao nhiêu"
                          // Difference = targetTBM - actualTBM. 
                          // If targetTBM > actualTBM => green (+ difference)? "mục tiêu lớn hơn chính hiển thị xanh". Wait! If my target is 9, but actual is 8 => diff is 1 => green + 1.0!
                          const difference = targetTBM > 0 && actualTBM > 0 ? targetTBM - actualTBM : null;

                          return (
                          <tr key={sub.id} className="group hover:bg-[#fafafa] transition duration-200">
                             <td className="p-4 align-middle sticky left-0 bg-white group-hover:bg-[#fafafa] z-10 font-semibold text-gray-900 border-r border-gray-50">
                                {sub.name}
                             </td>
                             <td className="p-4 align-middle text-center">
                                <input 
                                   type="text" 
                                   placeholder="8, 9..."
                                   value={goalRegStr || ''}
                                   onChange={(e) => updateSubject(sub.id, isHk1 ? { goalRegular1: e.target.value } : { goalRegular2: e.target.value })}
                                   className="w-full min-w-[100px] text-center py-2 px-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition"
                                />
                                <div className="mt-2 text-xs flex flex-col justify-center items-center gap-1">
                                    <span className="text-gray-500 font-medium">Thực tế: {actualReg.length > 0 ? actualReg.map(g => g.value).join(', ') : '-'}</span>
                                    {actualReg.length > 0 && goalReg.length > 0 && (
                                        <div className="flex gap-2">
                                            {actualReg.map((aGrade, idx) => {
                                                const gVal = goalReg[idx];
                                                if (gVal === undefined) return null;
                                                const diff = aGrade.value - gVal;
                                                return <span key={idx} className={`font-semibold ${diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{diff > 0 ? '+' : ''}{parseFloat(diff.toFixed(2))}</span>;
                                            })}
                                        </div>
                                    )}
                                </div>
                             </td>
                             <td className="p-4 align-middle text-center">
                                <input 
                                   type="number" 
                                   step="0.01" min="0" max="10"
                                   placeholder="-"
                                   value={goalMidStr || ''}
                                   onChange={(e) => updateSubject(sub.id, isHk1 ? { goalMidterm1: e.target.value } : { goalMidterm2: e.target.value })}
                                   className="w-16 text-center py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition"
                                />
                                <div className="mt-2 text-xs flex justify-center items-center gap-2">
                                    <span className="text-gray-500 font-medium">Thực tế: {actualMid?.value ?? '-'}</span>
                                    {actualMid?.value !== undefined && goalMid !== null && (
                                        (() => {
                                            const diff = actualMid.value - goalMid;
                                            return <span className={`font-semibold ${diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{diff > 0 ? '+' : ''}{diff.toFixed(2)}</span>;
                                        })()
                                    )}
                                </div>
                             </td>
                             <td className="p-4 align-middle text-center">
                                <input 
                                   type="number" 
                                   step="0.01" min="0" max="10"
                                   placeholder="-"
                                   value={goalFinStr || ''}
                                   onChange={(e) => updateSubject(sub.id, isHk1 ? { goalFinal1: e.target.value } : { goalFinal2: e.target.value })}
                                   className="w-16 text-center py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition"
                                />
                                <div className="mt-2 text-xs flex justify-center items-center gap-2">
                                    <span className="text-gray-500 font-medium">Thực tế: {actualFin?.value ?? '-'}</span>
                                    {actualFin?.value !== undefined && goalFin !== null && (
                                        (() => {
                                            const diff = actualFin.value - goalFin;
                                            return <span className={`font-semibold ${diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{diff > 0 ? '+' : ''}{diff.toFixed(2)}</span>;
                                        })()
                                    )}
                                </div>
                             </td>
                             
                             <td className="p-4 align-middle text-center border-l border-gray-50/50 bg-blue-50/30">
                                {hasDetailedInputs ? (
                                    <div className="font-bold text-lg text-blue-700">{targetTBM > 0 ? targetTBM.toFixed(2) : '-'}</div>
                                ) : (
                                    <input 
                                       type="number" 
                                       step="0.01" min="0" max="10"
                                       placeholder="TBM..."
                                       value={targetTBM > 0 ? targetTBM : ''}
                                       onChange={(e) => updateSubject(sub.id, isHk1 ? { targetTBM1: e.target.value ? parseFloat(e.target.value) : null } : { targetTBM2: e.target.value ? parseFloat(e.target.value) : null })}
                                       className="w-16 text-center py-1 border border-blue-200 rounded-lg text-sm font-semibold text-blue-900 bg-white shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition mx-auto"
                                    />
                                )}
                             </td>
                             <td className="p-4 align-middle text-center border-l border-gray-50/50 bg-gray-50/30">
                                <div className="font-bold text-lg text-gray-800">{actualTBM > 0 ? actualTBM.toFixed(2) : '-'}</div>
                                {targetTBM > 0 && actualTBM > 0 && (
                                    <div className={`text-xs mt-1 font-semibold ${actualTBM - targetTBM >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {actualTBM - targetTBM > 0 ? '+' : ''}{(actualTBM - targetTBM).toFixed(2)}
                                    </div>
                                )}
                             </td>
                          </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
        </div>
      </motion.div>
    );
  };
  
  const GradesView: React.FC = () => {
  const { subjects, addSubject, loading, activeSemester, setActiveSemester, defaultSemester, setDefaultSemester } = useGrade();
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubjectName.trim()) {
      addSubject(newSubjectName.trim());
      setNewSubjectName('');
      setIsAdding(false);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center h-full"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <motion.div 
      initial={emptyViewState}
      animate={viewAnimateState}
      exit={emptyViewState}
      className="flex flex-col min-h-full pb-24"
    >
      <div className="px-6 pt-12 pb-4 flex justify-between items-end">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Điểm số</h1>
        <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                    onClick={() => setActiveSemester('HK1')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${activeSemester === 'HK1' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    HK1
                </button>
                <button 
                    onClick={() => setActiveSemester('HK2')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${activeSemester === 'HK2' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    HK2
                </button>
            </div>
            
            <div className="relative">
                <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="p-2 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
                    title="Cài đặt mặc định"
                >
                    <Settings size={20} />
                </button>
                <AnimatePresence>
                    {isSettingsOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 z-50 p-4"
                        >
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Cài đặt mặc định</h3>
                            <div className="text-xs text-gray-500 mb-2">Kỳ học mặc định khi mở app:</div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setDefaultSemester('HK1')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all border ${defaultSemester === 'HK1' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    HK 1
                                </button>
                                <button 
                                    onClick={() => setDefaultSemester('HK2')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all border ${defaultSemester === 'HK2' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    HK 2
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        <StatsBoard />

        <div className="space-y-3">
          <div className="flex justify-between items-center px-2">
             <h2 className="text-xl font-semibold tracking-tight text-gray-900">Môn học</h2>
             <button 
                onClick={() => setIsAdding(!isAdding)}
                className="text-blue-500 font-medium hover:text-blue-600 transition flex items-center gap-1"
             >
                <Plus size={20} />
             </button>
          </div>

          {isAdding && (
             <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-2"
                onSubmit={handleAddSubject}
             >
                <input 
                    type="text" 
                    placeholder="Tên môn học (VD: Toán)..." 
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="flex-1 bg-gray-100 rounded-xl px-4 py-2 outline-none focus:bg-gray-200 transition"
                    autoFocus
                />
                <button 
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium"
                >
                    Thêm
                </button>
             </motion.form>
          )}

          {subjects.length === 0 && !isAdding ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-gray-400 mb-2">Chưa có môn học nào</div>
                  <button 
                      onClick={() => setIsAdding(true)}
                      className="text-blue-500 font-medium"
                  >
                      Thêm ngay
                  </button>
              </div>
          ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-gray-50/80 border-b border-gray-100 text-sm text-gray-500 font-semibold tracking-wide">
                              <th className="p-4 whitespace-nowrap min-w-[150px]">Môn học</th>
                              <th className="p-4 whitespace-nowrap min-w-[200px]">Đánh giá thường xuyên</th>
                              <th className="p-4 whitespace-nowrap text-center">Giữa kì</th>
                              <th className="p-4 whitespace-nowrap text-center">Cuối kì</th>
                              {activeSemester === 'HK1' ? (
                                  <th className="p-4 whitespace-nowrap text-center text-blue-600 bg-blue-50/30">TBM</th>
                              ) : (
                                  <>
                                      <th className="p-4 whitespace-nowrap text-center">TBM HK1</th>
                                      <th className="p-4 whitespace-nowrap text-center text-blue-600 bg-blue-50/30">TBM HK2</th>
                                      <th className="p-4 whitespace-nowrap text-center text-emerald-600 bg-emerald-50/30">TBM CN</th>
                                  </>
                              )}
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {subjects.map((sub, index) => (
                              <SubjectRow key={sub.id} subject={sub} />
                          ))}
                      </tbody>
                  </table>
              </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// We will embed Schedule directly instead of a modal for better mobile UX
const ScheduleView: React.FC = () => {
  return (
    <motion.div 
      initial={emptyViewState}
      animate={viewAnimateState}
      exit={emptyViewState}
      className="flex flex-col min-h-full pb-24"
    >
      <div className="px-6 pt-12 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Lịch học</h1>
      </div>
      {/* Reusing the modal logic but inline */}
      <div className="px-4 mt-2">
         <ScheduleModal isOpen={true} onClose={() => {}} />
      </div>
    </motion.div>
  );
};

type TabType = 'grades' | 'goals' | 'schedule' | 'stats' | 'finance' | 'achievements';

const MainLayout: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('grades');

    const NavItems = () => (
        <>
            <button 
                onClick={() => setActiveTab('grades')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'grades' ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
            >
                <GraduationCap size={22} strokeWidth={activeTab === 'grades' ? 2.5 : 2} />
                <span className="hidden md:block">Điểm số</span>
            </button>
            <button 
                onClick={() => setActiveTab('goals')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'goals' ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
            >
                <Target size={22} strokeWidth={activeTab === 'goals' ? 2.5 : 2} />
                <span className="hidden md:block">Mục tiêu</span>
            </button>
            <button 
                onClick={() => setActiveTab('schedule')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'schedule' ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
            >
                <CalendarDays size={22} strokeWidth={activeTab === 'schedule' ? 2.5 : 2} />
                <span className="hidden md:block">Lịch học</span>
            </button>
            <button 
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'stats' ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
            >
                <BarChart2 size={22} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
                <span className="hidden md:block">Thống kê</span>
            </button>
            <button 
                onClick={() => setActiveTab('finance')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'finance' ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
            >
                <Wallet size={22} strokeWidth={activeTab === 'finance' ? 2.5 : 2} />
                <span className="hidden md:block">Tài chính</span>
            </button>
            <button 
                onClick={() => setActiveTab('achievements')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'achievements' ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
            >
                <Trophy size={22} strokeWidth={activeTab === 'achievements' ? 2.5 : 2} />
                <span className="hidden md:block">Thành tích</span>
            </button>
        </>
    );

    return (
        <div className="h-screen w-full bg-[#f8f9fa] flex font-sans overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 px-4 py-8 shadow-[1px_0_10px_rgba(0,0,0,0.01)] z-10">
        <div className="flex items-center gap-3 px-4 mb-8 mt-2 overflow-hidden">
            <svg viewBox="0 0 120 100" className="w-10 h-10 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Central Petal */}
                <path d="M60 5 C 65 25 70 50 60 85 C 50 50 55 25 60 5 Z" fill="#0c6b3e" />
                {/* Inner Right Petal */}
                <path d="M64 42 C 85 30 110 40 70 85 C 95 65 85 45 64 42 Z" fill="#0c6b3e" />
                {/* Inner Left Petal */}
                <path d="M56 42 C 35 30 10 40 50 85 C 25 65 35 45 56 42 Z" fill="#0c6b3e" />
                {/* Outer Right Petal */}
                <path d="M72 60 C 100 50 115 70 75 88 C 105 80 95 65 72 60 Z" fill="#0c6b3e" />
                {/* Outer Left Petal */}
                <path d="M48 60 C 20 50 5 70 45 88 C 15 80 25 65 48 60 Z" fill="#0c6b3e" />
                {/* Base curve overlay */}
                <ellipse cx="60" cy="85" rx="35" ry="10" fill="white" />
                <ellipse cx="60" cy="90" rx="35" ry="10" fill="#0c6b3e" />
            </svg>
            <span className="font-semibold text-2xl tracking-wide truncate" style={{ fontFamily: '"Great Vibes", "Dancing Script", "Pacifico", cursive', color: '#4c5561' }}>Lotus Study</span>
        </div>
                <nav className="flex flex-col gap-2">
                    <NavItems />
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto w-full flex justify-center pb-20 md:pb-0 relative">
                <div className="w-full max-w-5xl md:px-8 py-4 md:py-8">
                    <AnimatePresence mode="wait">
                        {activeTab === 'grades' && <GradesView key="grades" />}
                        {activeTab === 'goals' && <GoalsView key="goals" />}
                        {activeTab === 'schedule' && <ScheduleView key="schedule" />}
                        {activeTab === 'stats' && <StatsView key="stats" />}
                        {activeTab === 'finance' && <FinanceView key="finance" />}
                        {activeTab === 'achievements' && <AchievementsView key="achievements" />}
                    </AnimatePresence>
                </div>
            </main>

            {/* Mobile Bottom Tab Bar */}
            <div className="md:hidden bg-white/90 backdrop-blur-xl border-t border-gray-200/50 pb-safe pt-2 fixed bottom-0 w-full z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] overflow-x-auto [&::-webkit-scrollbar]:hidden">
                <div className="flex justify-start sm:justify-around items-center px-4 pb-3 pt-2 gap-6 min-w-max">
                    <button 
                        onClick={() => setActiveTab('grades')}
                        className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'grades' ? 'text-blue-600' : 'text-gray-400'}`}
                    >
                        <GraduationCap size={22} strokeWidth={activeTab === 'grades' ? 2.5 : 2} />
                        <span className="text-[10px] font-medium mt-0.5">Điểm số</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('goals')}
                        className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'goals' ? 'text-blue-600' : 'text-gray-400'}`}
                    >
                        <Target size={22} strokeWidth={activeTab === 'goals' ? 2.5 : 2} />
                        <span className="text-[10px] font-medium mt-0.5">Mục tiêu</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('schedule')}
                        className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'schedule' ? 'text-blue-600' : 'text-gray-400'}`}
                    >
                        <CalendarDays size={22} strokeWidth={activeTab === 'schedule' ? 2.5 : 2} />
                        <span className="text-[10px] font-medium mt-0.5">Lịch học</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'stats' ? 'text-blue-600' : 'text-gray-400'}`}
                    >
                        <BarChart2 size={22} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
                        <span className="text-[10px] font-medium mt-0.5">Thống kê</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('finance')}
                        className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'finance' ? 'text-blue-600' : 'text-gray-400'}`}
                    >
                        <Wallet size={22} strokeWidth={activeTab === 'finance' ? 2.5 : 2} />
                        <span className="text-[10px] font-medium mt-0.5">Tài chính</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('achievements')}
                        className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'achievements' ? 'text-blue-600' : 'text-gray-400'}`}
                    >
                        <Trophy size={22} strokeWidth={activeTab === 'achievements' ? 2.5 : 2} />
                        <span className="text-[10px] font-medium mt-0.5">Thành tích</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  return (
    <GradeProvider>
      <MainLayout />
    </GradeProvider>
  );
};

export default App;