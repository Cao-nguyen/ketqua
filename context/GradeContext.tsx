import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, SubjectData, Grade, GradeType, BonusPoint, WeekSchedule } from '../types';
import { loadData, saveData, saveConfig, loadConfig } from '../services/storageService';
import { syncToSheet, loadFromSheet } from '../services/googleSheetService';
import { v4 as uuidv4 } from 'uuid';

interface GradeContextType {
  subjects: SubjectData[];
  weeks: WeekSchedule[];
  addSubject: (name: string) => void;
  deleteSubject: (id: string) => void;
  addGrade: (subjectId: string, type: GradeType, value: number, reason: string) => void;
  updateGrade: (subjectId: string, gradeId: string, type: GradeType, newValue: number, newReason: string) => void;
  deleteGrade: (subjectId: string, gradeId: string, type: GradeType) => void;
  addBonusPoint: (subjectId: string, value: number, reason: string) => void;
  useBonusPoint: (subjectId: string, gradeId: string, gradeType: GradeType, bonusAmount: number) => boolean;
  updateSemester1Average: (subjectId: string, value: number | null) => void;
  
  // Schedule
  addWeek: (week: WeekSchedule) => void;
  updateWeek: (week: WeekSchedule) => void;
  deleteWeek: (id: string) => void;

  // Cloud Sync
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
  syncStatus: 'idle' | 'syncing' | 'saved' | 'error';
  lastSyncTime: Date | null;
  forceSync: () => Promise<void>;
  forceLoad: () => Promise<void>;
}

const GradeContext = createContext<GradeContextType | undefined>(undefined);

export const GradeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppState>({ subjects: [], weeks: [] });
  const [sheetUrl, setSheetUrlState] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loaded = loadData();
    // Ensure existing data has the new field if it's missing (migration)
    const migratedSubjects = loaded.subjects.map(s => ({
        ...s,
        semester1Average: s.semester1Average !== undefined ? s.semester1Average : null
    }));
    setData({ ...loaded, subjects: migratedSubjects });

    const config = loadConfig();
    if (config.sheetUrl) {
        setSheetUrlState(config.sheetUrl);
    }
  }, []);

  const setSheetUrl = (url: string) => {
      setSheetUrlState(url);
      saveConfig(url);
  };

  const handleSyncToCloud = useCallback(async (currentData: AppState, url: string) => {
    if (!url) return;
    setSyncStatus('syncing');
    const result = await syncToSheet(url, currentData);
    if (result.success) {
        setSyncStatus('saved');
        setLastSyncTime(new Date());
        setTimeout(() => setSyncStatus('idle'), 3000);
    } else {
        setSyncStatus('error');
    }
  }, []);

  useEffect(() => {
    saveData(data);

    if (sheetUrl) {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        setSyncStatus('idle'); 
        
        debounceTimerRef.current = setTimeout(() => {
            handleSyncToCloud(data, sheetUrl);
        }, 3000); 
    }
    
    return () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [data, sheetUrl, handleSyncToCloud]);

  const forceSync = async () => {
      if (!sheetUrl) return;
      await handleSyncToCloud(data, sheetUrl);
  };

  const forceLoad = async () => {
      if (!sheetUrl) return;
      setSyncStatus('syncing');
      const result = await loadFromSheet(sheetUrl);
      if (result.success && result.data) {
          const loadedData = result.data as any;
          // Compatibility handling
          const loadedSubjects = loadedData.subjectsSem2 || loadedData.subjects || [];
          const migratedSubjects = loadedSubjects.map((s: any) => ({
             ...s,
             semester1Average: s.semester1Average !== undefined ? s.semester1Average : null
          }));

          const newState: AppState = {
              subjects: migratedSubjects,
              weeks: loadedData.weeks || []
          };
          setData(newState);
          setSyncStatus('saved');
          setLastSyncTime(new Date());
          saveData(newState);
          setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
          setSyncStatus('error');
          alert(result.message || "Lỗi tải dữ liệu");
      }
  };

  const currentSubjects = data.subjects;
  const currentWeeks = data.weeks || [];

  const updateSubjects = useCallback((newSubjects: SubjectData[]) => {
    setData(prev => ({ ...prev, subjects: newSubjects }));
  }, []);

  const updateWeeks = useCallback((newWeeks: WeekSchedule[]) => {
    setData(prev => ({ ...prev, weeks: newWeeks }));
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

  const addGrade = (subjectId: string, type: GradeType, value: number, reason: string) => {
    const newGrade: Grade = {
      id: uuidv4(),
      value,
      reason,
      timestamp: Date.now()
    };

    const newSubjects = currentSubjects.map(sub => {
      if (sub.id !== subjectId) return sub;
      if (type === GradeType.REGULAR) {
        return { ...sub, regularGrades: [...sub.regularGrades, newGrade] };
      } else if (type === GradeType.MIDTERM) {
        return { ...sub, midtermGrade: newGrade };
      } else {
        return { ...sub, finalGrade: newGrade };
      }
    });
    updateSubjects(newSubjects);
  };

  const updateGrade = (subjectId: string, gradeId: string, type: GradeType, newValue: number, newReason: string) => {
    const newSubjects = currentSubjects.map(sub => {
      if (sub.id !== subjectId) return sub;
      
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
      return sub;
    });
    updateSubjects(newSubjects);
  };

  const deleteGrade = (subjectId: string, gradeId: string, type: GradeType) => {
     const newSubjects = currentSubjects.map(sub => {
      if (sub.id !== subjectId) return sub;
      
      if (type === GradeType.REGULAR) {
        return { ...sub, regularGrades: sub.regularGrades.filter(g => g.id !== gradeId) };
      } else if (type === GradeType.MIDTERM && sub.midtermGrade?.id === gradeId) {
        return { ...sub, midtermGrade: null };
      } else if (type === GradeType.FINAL && sub.finalGrade?.id === gradeId) {
        return { ...sub, finalGrade: null };
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

    let updatedRegular = subject.regularGrades;
    let updatedMid = subject.midtermGrade;
    let updatedFinal = subject.finalGrade;

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
        return {
            ...sub,
            bonusPoints: newBonusPoints,
            regularGrades: updatedRegular,
            midtermGrade: updatedMid,
            finalGrade: updatedFinal
        };
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

  return (
    <GradeContext.Provider value={{ 
      subjects: currentSubjects, 
      weeks: currentWeeks,
      addSubject, 
      deleteSubject,
      addGrade,
      updateGrade,
      deleteGrade,
      addBonusPoint,
      useBonusPoint,
      updateSemester1Average,
      addWeek,
      updateWeek,
      deleteWeek,
      sheetUrl,
      setSheetUrl,
      syncStatus,
      lastSyncTime,
      forceSync,
      forceLoad
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