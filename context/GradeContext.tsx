import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, SubjectData, Grade, GradeType, BonusPoint, WeekSchedule, Transaction } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface GradeContextType {
  subjects: SubjectData[];
  weeks: WeekSchedule[];
  transactions: Transaction[];
  loading: boolean;
  activeSemester: 'HK1' | 'HK2';
  setDefaultSemester: (sem: 'HK1' | 'HK2') => void;
  defaultSemester: 'HK1' | 'HK2';
  setActiveSemester: (sem: 'HK1' | 'HK2') => void;
  defaultWeekId: string | null;
  setDefaultWeekId: (id: string | null) => void;
  addSubject: (name: string) => void;
  deleteSubject: (id: string) => void;
  addGrade: (subjectId: string, type: GradeType, value: number, reason: string) => void;
  updateGrade: (subjectId: string, gradeId: string, type: GradeType, newValue: number, newReason: string) => void;
  deleteGrade: (subjectId: string, gradeId: string, type: GradeType) => void;
  addBonusPoint: (subjectId: string, value: number, reason: string) => void;
  useBonusPoint: (subjectId: string, gradeId: string, gradeType: GradeType, bonusAmount: number) => boolean;
  deleteBonusPoint: (subjectId: string, bonusId: string) => void;
  updateSemester1Average: (subjectId: string, value: number | null) => void;
  updateTargetTBM1: (subjectId: string, value: number | null) => void;
  updateTargetTBM2: (subjectId: string, value: number | null) => void;
  
  // Schedule
  addWeek: (week: WeekSchedule) => void;
  updateWeek: (week: WeekSchedule) => void;
  deleteWeek: (id: string) => void;

  // Finance
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
}

const GradeContext = createContext<GradeContextType | undefined>(undefined);

export const GradeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [data, setData] = useState<AppState>({
  subjects: [],
  weeks: [],
  transactions: []
});
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  const initialDefaultSem = (localStorage.getItem('defaultSemester') as 'HK1' | 'HK2') || 'HK1';
  const [defaultSemester, setDefaultSemesterState] = useState<'HK1' | 'HK2'>(initialDefaultSem);
  const [activeSemester, setActiveSemester] = useState<'HK1' | 'HK2'>(initialDefaultSem);

  const initialDefaultWeekId = localStorage.getItem('defaultWeekId');
  const [defaultWeekId, setDefaultWeekIdState] = useState<string | null>(initialDefaultWeekId);

  const setDefaultSemester = (sem: 'HK1' | 'HK2') => {
      localStorage.setItem('defaultSemester', sem);
      setDefaultSemesterState(sem);
  };

  const setDefaultWeekId = (id: string | null) => {
      if (id) {
          localStorage.setItem('defaultWeekId', id);
      } else {
          localStorage.removeItem('defaultWeekId');
      }
      setDefaultWeekIdState(id);
  };

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/data');
        if (response.ok) {
          const result = await response.json();
          let loadedWeeks = result.weeks || [];

          let loadedSubjects = result.subjects || [];

          const defaultSubjectNames = ['Ngữ văn', 'Tiếng Anh', 'Toán', 'Địa lí', 'Lịch sử', 'Vật lí', 'Tin học', 'GDKTPL', 'GDQP'];
          
          defaultSubjectNames.forEach(name => {
              if (!loadedSubjects.find((s: SubjectData) => s.name === name)) {
                  loadedSubjects.push({
                      id: uuidv4(),
                      name,
                      regularGrades: [],
                      midtermGrade: null,
                      finalGrade: null,
                      bonusPoints: [],
                      semester1Average: null
                  });
              }
          });

          // Auto-generate 35 weeks if none exist
          if (loadedWeeks.length === 0) {
              const emptyDay = () => ({ 
                  date: '', 
                  morning: Array(5).fill({ subjectName: '', teacherName: '' }), 
                  afternoon: Array(5).fill({ subjectName: '', teacherName: '' }) 
              });
              loadedWeeks = Array.from({length: 35}).map((_, i) => ({
                  id: uuidv4(),
                  name: `Tuần ${i + 1}`,
                  days: { mon: emptyDay(), tue: emptyDay(), wed: emptyDay(), thu: emptyDay(), fri: emptyDay(), sat: emptyDay() }
              }));
          }

         setData({
  subjects: loadedSubjects,
  weeks: loadedWeeks,
  transactions: result.transactions || []
});
        }
      } catch (error) {
        console.error("Failed to load data from MongoDB:", error);
      } finally {
        setLoading(false);
        setIsFirstLoad(false);
      }
    };
    fetchInitialData();
  }, []);

  // Auto-save to MongoDB
  useEffect(() => {
    if (isFirstLoad) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    
    debounceTimerRef.current = setTimeout(async () => {
      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } catch (error) {
        console.error("Failed to save data to MongoDB:", error);
      }
    }, 1000); // 1s debounce
    
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [data, isFirstLoad]);

  const currentSubjects = data.subjects;
  const currentWeeks = data.weeks || [];
  const currentTransactions = data.transactions || [];

  const updateSubjects = useCallback((newSubjects: SubjectData[]) => {
    setData(prev => ({ ...prev, subjects: newSubjects }));
  }, []);

  const updateWeeks = useCallback((newWeeks: WeekSchedule[]) => {
    setData(prev => ({ ...prev, weeks: newWeeks }));
  }, []);

  const updateTransactions = useCallback((newTransactions: Transaction[]) => {
    setData(prev => ({ ...prev, transactions: newTransactions }));
  }, []);

  const addSubject = (name: string) => {
    const newSubject: SubjectData = {
      id: uuidv4(),
      name,
      regularGrades: [],
      midtermGrade: null,
      finalGrade: null,
      bonusPoints: [],
      semester1Average: null
    };
    updateSubjects([...currentSubjects, newSubject]);
  };

  const deleteSubject = (id: string) => {
    updateSubjects(currentSubjects.filter(s => s.id !== id));
  };

  const updateSemester1Average = (subjectId: string, value: number | null) => {
      const newSubjects = currentSubjects.map(sub => {
          if (sub.id !== subjectId) return sub;
          return { ...sub, semester1Average: value };
      });
      updateSubjects(newSubjects);
  };

  const updateTargetTBM1 = (subjectId: string, value: number | null) => {
      const newSubjects = currentSubjects.map(sub => {
          if (sub.id !== subjectId) return sub;
          return { ...sub, targetTBM1: value };
      });
      updateSubjects(newSubjects);
  };

  const updateTargetTBM2 = (subjectId: string, value: number | null) => {
      const newSubjects = currentSubjects.map(sub => {
          if (sub.id !== subjectId) return sub;
          return { ...sub, targetTBM2: value };
      });
      updateSubjects(newSubjects);
  };

  const addGrade = (subjectId: string, type: GradeType, value: number, reason: string) => {
    const newGrade: Grade = {
      id: uuidv4(),
      value,
      reason,
      timestamp: Date.now()
    };

    const newSubjects = currentSubjects.map(sub => {
      if (sub.id !== subjectId) return sub;
      if (activeSemester === 'HK1') {
        if (type === GradeType.REGULAR) {
          return { ...sub, regularGrades1: [...(sub.regularGrades1 || []), newGrade] };
        } else if (type === GradeType.MIDTERM) {
          return { ...sub, midtermGrade1: newGrade };
        } else {
          return { ...sub, finalGrade1: newGrade };
        }
      } else {
        if (type === GradeType.REGULAR) {
          return { ...sub, regularGrades: [...sub.regularGrades, newGrade] };
        } else if (type === GradeType.MIDTERM) {
          return { ...sub, midtermGrade: newGrade };
        } else {
          return { ...sub, finalGrade: newGrade };
        }
      }
    });
    updateSubjects(newSubjects);
  };

  const updateGrade = (subjectId: string, gradeId: string, type: GradeType, newValue: number, newReason: string) => {
    const newSubjects = currentSubjects.map(sub => {
      if (sub.id !== subjectId) return sub;
      
      if (activeSemester === 'HK1') {
        if (type === GradeType.REGULAR) {
          return { ...sub, regularGrades1: (sub.regularGrades1 || []).map(g => g.id === gradeId ? { ...g, value: newValue, reason: newReason } : g) };
        } else if (type === GradeType.MIDTERM && sub.midtermGrade1?.id === gradeId) {
          return { ...sub, midtermGrade1: { ...sub.midtermGrade1, value: newValue, reason: newReason } };
        } else if (type === GradeType.FINAL && sub.finalGrade1?.id === gradeId) {
          return { ...sub, finalGrade1: { ...sub.finalGrade1, value: newValue, reason: newReason } };
        }
      } else {
        if (type === GradeType.REGULAR) {
          return {
            ...sub,
            regularGrades: sub.regularGrades.map(g => g.id === gradeId ? { ...g, value: newValue, reason: newReason } : g)
          };
        } else if (type === GradeType.MIDTERM && sub.midtermGrade?.id === gradeId) {
          return { ...sub, midtermGrade: { ...sub.midtermGrade, value: newValue, reason: newReason } };
        } else if (type === GradeType.FINAL && sub.finalGrade?.id === gradeId) {
          return { ...sub, finalGrade: { ...sub.finalGrade, value: newValue, reason: newReason } };
        }
      }
      return sub;
    });
    updateSubjects(newSubjects);
  };

  const deleteGrade = (subjectId: string, gradeId: string, type: GradeType) => {
     const newSubjects = currentSubjects.map(sub => {
      if (sub.id !== subjectId) return sub;
      
      if (activeSemester === 'HK1') {
        if (type === GradeType.REGULAR) {
          return { ...sub, regularGrades1: (sub.regularGrades1 || []).filter(g => g.id !== gradeId) };
        } else if (type === GradeType.MIDTERM && sub.midtermGrade1?.id === gradeId) {
          return { ...sub, midtermGrade1: null };
        } else if (type === GradeType.FINAL && sub.finalGrade1?.id === gradeId) {
          return { ...sub, finalGrade1: null };
        }
      } else {
        if (type === GradeType.REGULAR) {
          return { ...sub, regularGrades: sub.regularGrades.filter(g => g.id !== gradeId) };
        } else if (type === GradeType.MIDTERM && sub.midtermGrade?.id === gradeId) {
          return { ...sub, midtermGrade: null };
        } else if (type === GradeType.FINAL && sub.finalGrade?.id === gradeId) {
          return { ...sub, finalGrade: null };
        }
      }
      return sub;
    });
    updateSubjects(newSubjects);
  };

  const addBonusPoint = (subjectId: string, value: number, reason: string) => {
    const newBonus: BonusPoint = { id: uuidv4(), value, reason, timestamp: Date.now() };
    const newSubjects = currentSubjects.map(sub => {
      if (sub.id !== subjectId) return sub;
      return { ...sub, bonusPoints: [...sub.bonusPoints, newBonus] };
    });
    updateSubjects(newSubjects);
  };

  const deleteBonusPoint = (subjectId: string, bonusId: string) => {
    const newSubjects = currentSubjects.map(sub => {
      if (sub.id !== subjectId) return sub;
      return { ...sub, bonusPoints: sub.bonusPoints.filter(b => b.id !== bonusId) };
    });
    updateSubjects(newSubjects);
  };

  const useBonusPoint = (subjectId: string, gradeId: string, gradeType: GradeType, bonusAmount: number): boolean => {
    const subject = currentSubjects.find(s => s.id === subjectId);
    if (!subject) return false;
    
    const totalBonus = subject.bonusPoints.reduce((sum, b) => sum + b.value, 0);
    if (totalBonus < bonusAmount) return false;

    let remainingToConsume = bonusAmount;
    let newBonusPoints = [...subject.bonusPoints];
    
    newBonusPoints = newBonusPoints.map(bp => {
        if (remainingToConsume <= 0) return bp;
        
        if (bp.value <= remainingToConsume) {
            remainingToConsume -= bp.value;
            return { ...bp, value: 0 }; 
        } else {
            const newVal = bp.value - remainingToConsume;
            remainingToConsume = 0;
            return { ...bp, value: newVal };
        }
    }).filter(bp => bp.value > 0);

    let updatedRegular = activeSemester === 'HK1' ? (subject.regularGrades1 || []) : subject.regularGrades;
    let updatedMid = activeSemester === 'HK1' ? subject.midtermGrade1 : subject.midtermGrade;
    let updatedFinal = activeSemester === 'HK1' ? subject.finalGrade1 : subject.finalGrade;

    const appendReason = ` (+${bonusAmount})`;

    if (gradeType === GradeType.REGULAR) {
        updatedRegular = updatedRegular.map(g => g.id === gradeId ? { ...g, value: g.value + bonusAmount, reason: g.reason + appendReason } : g);
    } else if (gradeType === GradeType.MIDTERM && updatedMid?.id === gradeId) {
        updatedMid = { ...updatedMid, value: updatedMid.value + bonusAmount, reason: updatedMid.reason + appendReason };
    } else if (gradeType === GradeType.FINAL && updatedFinal?.id === gradeId) {
        updatedFinal = { ...updatedFinal, value: updatedFinal.value + bonusAmount, reason: updatedFinal.reason + appendReason };
    }

    const newSubjects = currentSubjects.map(sub => {
        if (sub.id !== subjectId) return sub;
        if (activeSemester === 'HK1') {
            return {
                ...sub,
                bonusPoints: newBonusPoints,
                regularGrades1: updatedRegular,
                midtermGrade1: updatedMid,
                finalGrade1: updatedFinal
            };
        } else {
            return {
                ...sub,
                bonusPoints: newBonusPoints,
                regularGrades: updatedRegular,
                midtermGrade: updatedMid,
                finalGrade: updatedFinal
            };
        }
    });
    updateSubjects(newSubjects);
    return true;
  };

  const addWeek = (week: WeekSchedule) => {
    updateWeeks([...currentWeeks, week]);
  };

  const updateWeek = (week: WeekSchedule) => {
    updateWeeks(currentWeeks.map(w => w.id === week.id ? week : w));
  };

  const deleteWeek = (id: string) => {
    updateWeeks(currentWeeks.filter(w => w.id !== id));
  };

  const addTransaction = (txn: Omit<Transaction, 'id' | 'timestamp'>) => {
    updateTransactions([...currentTransactions, { ...txn, id: uuidv4(), timestamp: Date.now() }]);
  };

  const updateTransaction = (txn: Transaction) => {
    updateTransactions(currentTransactions.map(t => t.id === txn.id ? txn : t));
  };

  const deleteTransaction = (id: string) => {
    updateTransactions(currentTransactions.filter(t => t.id !== id));
  };

  return (
    <GradeContext.Provider value={{ 
      subjects: currentSubjects, 
      weeks: currentWeeks,
      transactions: currentTransactions,
      loading,
      activeSemester,
      setActiveSemester,
      defaultSemester,
      setDefaultSemester,
      defaultWeekId,
      setDefaultWeekId,
      addSubject,
      deleteSubject,
      addGrade,
      updateGrade,
      deleteGrade,
      addBonusPoint,
      useBonusPoint,
      deleteBonusPoint,
      updateSemester1Average,
      updateTargetTBM1,
      updateTargetTBM2,
      addWeek,
      updateWeek,
      deleteWeek,
      addTransaction,
      updateTransaction,
      deleteTransaction
    }}>
      {children}
    </GradeContext.Provider>
  );
};

export const useGrade = () => {
  const context = useContext(GradeContext);
  if (!context) throw new Error("useGrade must be used within a GradeProvider");
  return context;
};