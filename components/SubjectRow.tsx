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
  const { addGrade, updateGrade, deleteGrade, addBonusPoint, useBonusPoint, deleteBonusPoint, deleteSubject, updateSemester1Average, activeSemester } = useGrade();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<{ id: string, type: GradeType } | null>(null);
  const [targetType, setTargetType] = useState<GradeType>(GradeType.REGULAR);

  const calculateAvg = (reg: Grade[], mid: Grade | null | undefined, fin: Grade | null | undefined): number => {
      const regSum = reg.reduce((sum, g) => sum + g.value, 0);
      const countReg = reg.length;
      const midVal = mid ? mid.value : 0;
      const finalVal = fin ? fin.value : 0;
      
      let numerator = 0;
      let denominator = 0;

      if (countReg > 0 || mid || fin) {
          numerator += regSum;
          denominator += countReg;
          if (mid) { numerator += midVal * 2; denominator += 2; }
          if (fin) { numerator += finalVal * 3; denominator += 3; }
          if (denominator > 0) return numerator / denominator;
      }
      return 0;
  };

  const calcHk1 = calculateAvg(subject.regularGrades1 || [], subject.midtermGrade1, subject.finalGrade1);
  const calcHk2 = calculateAvg(subject.regularGrades, subject.midtermGrade, subject.finalGrade);

  // If HK1 has detailed grades, use them. Otherwise fallback to manual input (if any)
  const actualHk1 = calcHk1 > 0 ? calcHk1 : subject.semester1Average;
  const tbmValue = activeSemester === 'HK1' ? calcHk1 : calcHk2;
  const displayTbm = tbmValue > 0 ? tbmValue.toFixed(2) : "---";

  const tbmSem1 = actualHk1;
  const tbmSem2 = calcHk2;

  let fullYearAverage = "---";
  let fullYearValue = 0;

  if (tbmSem1 !== null && tbmSem2 > 0) {
      fullYearValue = (tbmSem1 * 2 + tbmSem2 * 3) / 5;
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

  const currentRegularG = activeSemester === 'HK1' ? (subject.regularGrades1 || []) : subject.regularGrades;
  const currentMidG = activeSemester === 'HK1' ? subject.midtermGrade1 : subject.midtermGrade;
  const currentFinalG = activeSemester === 'HK1' ? subject.finalGrade1 : subject.finalGrade;

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
        return currentRegularG.find(g => g.id === editingGrade.id) || null;
    }
    if (editingGrade.type === GradeType.MIDTERM) return currentMidG || null;
    if (editingGrade.type === GradeType.FINAL) return currentFinalG || null;
    return null;
  };

  // Determine TBM Color
  const tbmColorClass = tbmValue > 0 ? getColor(tbmValue).replace('bg-', 'text-').split(' ')[1] : 'text-gray-400';
  const fullYearColorClass = fullYearValue > 0 ? getColor(fullYearValue).replace('bg-', 'text-').split(' ')[1] : 'text-gray-400';

  return (
    <>
      <tr className="group hover:bg-[#fafafa] transition duration-200">
        <td className="p-4 align-top min-w-[150px]">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-semibold text-gray-900 leading-tight">{subject.name}</h3>
            <button 
              onClick={() => { if(window.confirm(`Xóa môn ${subject.name}?`)) deleteSubject(subject.id); }}
              className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
            >
              <span className="sr-only">Xóa môn</span>
              <XIcon size={16} />
            </button>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50/80 hover:bg-blue-50/50 hover:text-blue-600 px-2 py-1 rounded-md cursor-pointer transition border border-gray-100" onClick={() => setBonusModalOpen(true)}>
              <Database size={12} className={totalBonus > 0 ? "text-blue-500" : "text-gray-400"} />
              <span className="font-medium">Điểm cộng: {totalBonus > 0 ? <span className="font-bold text-blue-600">+{totalBonus.toFixed(1)}</span> : "0"}</span>
          </div>
        </td>
        
        <td className="p-4 align-top min-w-[200px]">
          <div className="flex flex-wrap gap-2">
              {currentRegularG.map(g => (
                  <GradeChip 
                      key={g.id} 
                      grade={g} 
                      colorClass={getColor(g.value)} 
                      onClick={() => handleOpenEdit(g, GradeType.REGULAR)} 
                  />
              ))}
              <EmptySlot onClick={() => handleOpenAdd(GradeType.REGULAR)} />
          </div>
        </td>
        
        <td className="p-4 align-top text-center border-l border-gray-50/50">
          <div className="flex justify-center">
              {currentMidG ? (
                  <GradeChip 
                      grade={currentMidG} 
                      colorClass={getColor(currentMidG.value)} 
                      onClick={() => handleOpenEdit(currentMidG, GradeType.MIDTERM)} 
                  />
              ) : (
                  <EmptySlot onClick={() => handleOpenAdd(GradeType.MIDTERM)} label="Nhập giữa kì" />
              )}
          </div>
        </td>
        
        <td className="p-4 align-top text-center border-l border-gray-50/50">
          <div className="flex justify-center">
              {currentFinalG ? (
                  <GradeChip 
                      grade={currentFinalG} 
                      colorClass={getColor(currentFinalG.value)} 
                      onClick={() => handleOpenEdit(currentFinalG, GradeType.FINAL)} 
                  />
              ) : (
                  <EmptySlot onClick={() => handleOpenAdd(GradeType.FINAL)} label="Nhập cuối kì" />
              )}
          </div>
        </td>

        {activeSemester === 'HK1' ? (
           <td className="p-4 align-top text-center border-l border-gray-50/50 bg-blue-50/30">
              <div className={`font-bold text-base ${tbmColorClass}`}>
                  {displayTbm}
              </div>
              {subject.targetTBM1 !== undefined && subject.targetTBM1 !== null && tbmValue > 0 && (
                  <div className={`text-[10px] mt-1 font-semibold ${tbmValue >= subject.targetTBM1 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {tbmValue >= subject.targetTBM1 ? '+' : ''}{(tbmValue - subject.targetTBM1).toFixed(2)}
                  </div>
              )}
           </td>
        ) : (
           <>
               <td className="p-4 align-top text-center border-l border-gray-50/50">
                  {calcHk1 === 0 ? (
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
                          className="w-16 h-8 text-center px-1 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 bg-gray-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition mx-auto"
                      />
                  ) : (
                      <div>
                          <div className={`font-bold text-base ${calcHk1 > 0 ? getColor(calcHk1).replace('bg-', 'text-').split(' ')[1] : 'text-gray-400'}`}>
                              {calcHk1.toFixed(2)}
                          </div>
                      </div>
                  )}
                  {subject.targetTBM1 !== undefined && subject.targetTBM1 !== null && actualHk1 > 0 && (
                      <div className={`text-[10px] mt-1 font-semibold ${actualHk1 >= subject.targetTBM1 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {actualHk1 >= subject.targetTBM1 ? '+' : ''}{(actualHk1 - subject.targetTBM1).toFixed(2)}
                      </div>
                  )}
               </td>
               <td className="p-4 align-top text-center border-l border-gray-50/50 bg-blue-50/30">
                  <div className={`font-bold text-base ${tbmColorClass}`}>
                      {displayTbm}
                  </div>
                  {subject.targetTBM2 !== undefined && subject.targetTBM2 !== null && calcHk2 > 0 && (
                      <div className={`text-[10px] mt-1 font-semibold ${calcHk2 >= subject.targetTBM2 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {calcHk2 >= subject.targetTBM2 ? '+' : ''}{(calcHk2 - subject.targetTBM2).toFixed(2)}
                      </div>
                  )}
               </td>
               <td className="p-4 align-top text-center border-l border-gray-50/50 bg-emerald-50/30">
                  <div className={`font-bold text-base ${fullYearColorClass}`}>
                      {fullYearAverage}
                  </div>
               </td>
           </>
        )}
      </tr>

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
        onDelete={(id) => deleteBonusPoint(subject.id, id)}
      />
    </>
  );
};

// Helper icon component
const XIcon = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default SubjectRow;