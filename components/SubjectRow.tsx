import React, { useState } from 'react';
import { SubjectData, Grade, GradeType } from '../types';
import { useGrade } from '../context/GradeContext';
import { Plus, Database, ChevronRight } from 'lucide-react';
import GradeInputModal from './GradeInputModal';
import BonusModal from './BonusModal';

const GradeChip: React.FC<{ 
    grade: Grade; 
    onClick: () => void; 
    colorClass: string 
}> = ({ grade, onClick, colorClass }) => (
  <div className="relative group inline-block">
    <button
        onClick={onClick}
        className={`${colorClass} px-3 py-1 rounded-full text-sm font-bold shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 border border-opacity-20 flex items-center gap-1 cursor-pointer`}
    >
        {grade.value}
    </button>
    {/* Custom Tooltip that shows full text */}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-[200px] hidden group-hover:block z-20">
        <div className="bg-gray-800 text-white text-xs rounded-lg py-1 px-2 text-center whitespace-normal shadow-lg">
            {grade.reason}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
    </div>
  </div>
);

const EmptySlot: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label }) => (
  <button
    onClick={onClick}
    className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 text-gray-300 hover:text-indigo-500 flex items-center justify-center transition"
    title={label || "Thêm điểm"}
  >
    <Plus size={16} />
  </button>
);

const SubjectRow: React.FC<{ subject: SubjectData }> = ({ subject }) => {
  const { addGrade, updateGrade, deleteGrade, addBonusPoint, useBonusPoint, deleteSubject, updateSemester1Average } = useGrade();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<{ id: string, type: GradeType } | null>(null);
  const [targetType, setTargetType] = useState<GradeType>(GradeType.REGULAR);

  // Calculate TBM HKII (Current Semester)
  const regSum = subject.regularGrades.reduce((sum, g) => sum + g.value, 0);
  const countReg = subject.regularGrades.length;
  const midVal = subject.midtermGrade ? subject.midtermGrade.value : 0;
  const finalVal = subject.finalGrade ? subject.finalGrade.value : 0;
  
  let numerator = 0;
  let denominator = 0;
  let displayTbm = "---";
  let tbmValue = 0;

  if (countReg > 0 || subject.midtermGrade || subject.finalGrade) {
      // Add Regular
      numerator += regSum;
      denominator += countReg;

      // Add Midterm (Weight 2)
      if (subject.midtermGrade) {
          numerator += midVal * 2;
          denominator += 2;
      }

      // Add Final (Weight 3)
      if (subject.finalGrade) {
          numerator += finalVal * 3;
          denominator += 3;
      }

      if (denominator > 0) {
          tbmValue = numerator / denominator;
          displayTbm = tbmValue.toFixed(2);
      }
  }

  // Calculate Full Year Average
  // Formula: (HK1*2 + HK2*3) / 5
  const tbmSem1 = subject.semester1Average;
  let fullYearAverage = "---";
  let fullYearValue = 0;

  if (tbmSem1 !== null && tbmValue > 0) {
      fullYearValue = (tbmSem1 * 2 + tbmValue * 3) / 5;
      fullYearAverage = fullYearValue.toFixed(2);
  }

  const totalBonus = subject.bonusPoints.reduce((sum, b) => sum + b.value, 0);

  // Grade color logic
  const getColor = (val: number) => {
    if (val >= 8.0) return 'bg-emerald-100 text-emerald-800 border-emerald-500';
    if (val >= 6.5) return 'bg-blue-100 text-blue-800 border-blue-500';
    if (val >= 5.0) return 'bg-amber-100 text-amber-800 border-amber-500';
    return 'bg-red-100 text-red-800 border-red-500';
  };

  const handleOpenAdd = (type: GradeType) => {
    setEditingGrade(null);
    setTargetType(type);
    setModalOpen(true);
  };

  const handleOpenEdit = (grade: Grade, type: GradeType) => {
    setEditingGrade({ id: grade.id, type });
    setTargetType(type);
    setModalOpen(true);
  };

  const getInitialData = () => {
    if (!editingGrade) return null;
    if (editingGrade.type === GradeType.REGULAR) {
        return subject.regularGrades.find(g => g.id === editingGrade.id) || null;
    }
    if (editingGrade.type === GradeType.MIDTERM) return subject.midtermGrade;
    if (editingGrade.type === GradeType.FINAL) return subject.finalGrade;
    return null;
  };

  // Determine TBM Color
  const tbmColorClass = tbmValue > 0 ? getColor(tbmValue).replace('bg-', 'text-').split(' ')[1] : 'text-gray-400';
  const fullYearColorClass = fullYearValue > 0 ? getColor(fullYearValue).replace('bg-', 'text-').split(' ')[1] : 'text-gray-400';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4 hover:shadow-md transition duration-200">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Subject Info & Stats */}
        <div className="w-full md:w-1/4 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-gray-800">{subject.name}</h3>
              <button 
                onClick={() => { if(window.confirm(`Xóa môn ${subject.name}?`)) deleteSubject(subject.id); }}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <span className="sr-only">Xóa môn</span>
                <XIcon size={16} />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg cursor-pointer hover:bg-indigo-50 transition" onClick={() => setBonusModalOpen(true)}>
                <Database size={14} className="text-indigo-500" />
                <span>Kho điểm cộng: <span className="font-bold text-indigo-600">{totalBonus.toFixed(1)}</span></span>
                <Plus size={14} className="ml-auto text-gray-400" />
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
             {/* HK2 (Current) */}
             <div>
                <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">TBM HKII (Hiện tại)</div>
                <div className={`text-3xl font-bold ${tbmColorClass}`}>
                    {displayTbm}
                </div>
             </div>
             
             {/* HK1 Input */}
             <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                <div className="text-xs text-gray-500 font-medium">TBM HKI:</div>
                <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="10"
                    placeholder="-"
                    value={subject.semester1Average !== null ? subject.semester1Average : ''}
                    onChange={(e) => {
                        const val = e.target.value;
                        updateSemester1Average(subject.id, val === '' ? null : parseFloat(val));
                    }}
                    className="w-16 text-center border border-gray-300 rounded text-sm font-semibold text-gray-900 bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none p-1"
                />
             </div>

             {/* Full Year Calculated */}
             <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                 <div className="text-xs text-gray-500 font-bold uppercase">Cả Năm</div>
                 <div className={`text-lg font-bold ${fullYearColorClass} flex items-center gap-1`}>
                    {fullYearAverage}
                 </div>
             </div>
             <div className="text-[10px] text-gray-400 text-right italic">(HK1*2 + HK2*3)/5</div>
          </div>
        </div>

        {/* Grades Area */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Regular Grades */}
            <div className="md:col-span-6 space-y-2">
                <div className="text-xs font-semibold text-gray-400 uppercase">Thường Xuyên (Hệ số 1)</div>
                <div className="flex flex-wrap gap-2">
                    {subject.regularGrades.map(g => (
                        <GradeChip 
                            key={g.id} 
                            grade={g} 
                            colorClass={getColor(g.value)} 
                            onClick={() => handleOpenEdit(g, GradeType.REGULAR)} 
                        />
                    ))}
                    <EmptySlot onClick={() => handleOpenAdd(GradeType.REGULAR)} />
                </div>
            </div>

            {/* Midterm */}
            <div className="md:col-span-3 space-y-2">
                <div className="text-xs font-semibold text-gray-400 uppercase">Giữa Kì (Hệ số 2)</div>
                <div>
                    {subject.midtermGrade ? (
                        <GradeChip 
                            grade={subject.midtermGrade} 
                            colorClass={getColor(subject.midtermGrade.value)} 
                            onClick={() => handleOpenEdit(subject.midtermGrade!, GradeType.MIDTERM)} 
                        />
                    ) : (
                        <EmptySlot onClick={() => handleOpenAdd(GradeType.MIDTERM)} label="Nhập giữa kì" />
                    )}
                </div>
            </div>

            {/* Final */}
            <div className="md:col-span-3 space-y-2">
                <div className="text-xs font-semibold text-gray-400 uppercase">Cuối Kì (Hệ số 3)</div>
                 <div>
                    {subject.finalGrade ? (
                        <GradeChip 
                            grade={subject.finalGrade} 
                            colorClass={getColor(subject.finalGrade.value)} 
                            onClick={() => handleOpenEdit(subject.finalGrade!, GradeType.FINAL)} 
                        />
                    ) : (
                        <EmptySlot onClick={() => handleOpenAdd(GradeType.FINAL)} label="Nhập cuối kì" />
                    )}
                </div>
            </div>

        </div>
      </div>

      <GradeInputModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        gradeType={targetType}
        subjectName={subject.name}
        initialData={getInitialData()}
        maxBonusAvailable={totalBonus}
        onSave={(val, reason) => {
            if (editingGrade) {
                updateGrade(subject.id, editingGrade.id, targetType, val, reason);
            } else {
                addGrade(subject.id, targetType, val, reason);
            }
        }}
        onDelete={() => {
            if (editingGrade) {
                deleteGrade(subject.id, editingGrade.id, targetType);
            }
        }}
        onUseBonus={(amount) => {
            if (editingGrade) {
                useBonusPoint(subject.id, editingGrade.id, targetType, amount);
            }
        }}
      />

      <BonusModal
        isOpen={bonusModalOpen}
        onClose={() => setBonusModalOpen(false)}
        subjectName={subject.name}
        bonusPoints={subject.bonusPoints}
        onSave={(val, reason) => addBonusPoint(subject.id, val, reason)}
      />
    </div>
  );
};

// Helper icon component
const XIcon = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default SubjectRow;