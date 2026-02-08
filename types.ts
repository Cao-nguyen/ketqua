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
  bonusPoints: BonusPoint[]; // Kho điểm cộng
}

// Schedule Types
export interface PeriodInfo {
  subjectName: string;
  teacherName: string;
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
    sun: DaySchedule;
  };
}

export interface AppState {
  subjects: SubjectData[];
  weeks: WeekSchedule[];
}