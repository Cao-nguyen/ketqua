import { AppState } from '../types';
import { STORAGE_KEY } from '../constants';

const CONFIG_KEY = 'grademaster_config_v1';

export const loadData = (): AppState => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      const parsed = JSON.parse(serialized);
      // Migration: If old structure exists (subjectsSem1/2), migrate to simple subjects list (taking Sem 2 as requested)
      if (parsed.subjectsSem2) {
          return { subjects: parsed.subjectsSem2, weeks: [] };
      }
      // Ensure weeks exists
      if (!parsed.weeks) {
          return { ...parsed, weeks: [] };
      }
      return parsed;
    }
  } catch (e) {
    console.error("Failed to load data", e);
  }
  return {
    subjects: [],
    weeks: []
  };
};

export const saveData = (data: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};

export const saveConfig = (url: string) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ sheetUrl: url }));
};

export const loadConfig = (): { sheetUrl: string } => {
    try {
        const conf = localStorage.getItem(CONFIG_KEY);
        if (conf) return JSON.parse(conf);
    } catch (e) {}
    return { sheetUrl: '' };
};

export const exportToCSV = (data: AppState) => {
  const subjects = data.subjects;
  
  // Header
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Môn Học,Điểm Thường Xuyên,Điểm Giữa Kì,Điểm Cuối Kì,Điểm Cộng Còn Lại,Trung Bình Môn\n";

  subjects.forEach(sub => {
    const regular = sub.regularGrades.map(g => `${g.value} (${g.reason})`).join("; ");
    const midterm = sub.midtermGrade ? `${sub.midtermGrade.value} (${sub.midtermGrade.reason})` : "";
    const final = sub.finalGrade ? `${sub.finalGrade.value} (${sub.finalGrade.reason})` : "";
    
    // Calculate TBM Logic for Export matches the new requirement
    const regSum = sub.regularGrades.reduce((sum, g) => sum + g.value, 0);
    const countReg = sub.regularGrades.length;
    const midVal = sub.midtermGrade ? sub.midtermGrade.value : 0;
    const finalVal = sub.finalGrade ? sub.finalGrade.value : 0;

    let tbm = "N/A";
    let numerator = 0;
    let denominator = 0;

    if (countReg > 0 || sub.midtermGrade || sub.finalGrade) {
        numerator += regSum;
        denominator += countReg;

        if (sub.midtermGrade) {
            numerator += midVal * 2;
            denominator += 2;
        }
        if (sub.finalGrade) {
            numerator += finalVal * 3;
            denominator += 3;
        }
        
        if (denominator > 0) {
            tbm = (numerator / denominator).toFixed(2);
        }
    }

    const bonusTotal = sub.bonusPoints.reduce((sum, b) => sum + b.value, 0);

    const row = [
      `"${sub.name}"`,
      `"${regular}"`,
      `"${midterm}"`,
      `"${final}"`,
      `"${bonusTotal}"`,
      `"${tbm}"`
    ].join(",");
    csvContent += row + "\r\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `bang_diem_ki_2.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};