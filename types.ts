export enum GradeType {
  REGULAR = 'REGULAR', // Hệ số 1 (Thường xuyên)
  MIDTERM = 'MIDTERM', // Hệ số 2 (Giữa kì)
  FINAL = 'FINAL',     // Hệ số 3 (Cuối kì)
}

export interface Grade {
  id: string;
  value: number;
  reason: string; // Lí do có điểm
  timestamp: number;
}

export interface BonusPoint {
  id: string;
  value: number;
  reason: string;
  timestamp: number;
}

export interface SubjectData {
  id: string;
  name: string;
  regularGrades: Grade[];
  midtermGrade: Grade | null;
  finalGrade: Grade | null;
  // HK1 fields
  regularGrades1?: Grade[];
  midtermGrade1?: Grade | null;
  finalGrade1?: Grade | null;
  
  bonusPoints: BonusPoint[]; // Kho điểm cộng
  semester1Average: number | null; // Điểm TBM Học Kỳ 1
  
  // Target goals
  targetTBM1?: number | null;
  targetTBM2?: number | null;
  goalRegular1?: string;
  goalMidterm1?: string;
  goalFinal1?: string;
  goalRegular2?: string;
  goalMidterm2?: string;
  goalFinal2?: string;
}

// Schedule Types
export interface PeriodInfo {
  subjectName: string;
  teacherName: string;
  isMidterm?: boolean;
}

export interface DaySchedule {
  date: string; // DD/MM/YYYY
  morning: PeriodInfo[]; // 5 periods (0-4)
  afternoon: PeriodInfo[]; // 5 periods (0-4)
}

export interface WeekSchedule {
  id: string;
  name: string; // e.g., "Tuần 1"
  days: {
    mon: DaySchedule;
    tue: DaySchedule;
    wed: DaySchedule;
    thu: DaySchedule;
    fri: DaySchedule;
    sat: DaySchedule;
    sun?: DaySchedule;
  };
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  wallet: 'CASH' | 'BANK' | 'FUND' | 'DEBT';
  bankCode?: string;
  bankName?: string;
  bankLogo?: string;
  description: string;
  timestamp: number;
}

export interface Achievement {
  id: string;
  prize: string;
  competition: string;
  level: string;
  timestamp: number;
}

export interface AppState {
  subjects: SubjectData[];
  weeks: WeekSchedule[];
  transactions?: Transaction[];
  achievements?: Achievement[];
}