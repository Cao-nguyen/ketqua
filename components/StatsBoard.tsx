import React from 'react';
import { useGrade } from '../context/GradeContext';
import { TrendingUp, Award } from 'lucide-react';

const StatsBoard: React.FC = () => {
  const { subjects, activeSemester } = useGrade();

  if (subjects.length === 0) return null;

  let totalTbm = 0;
  let count = 0;
  const tbmList: number[] = [];

  subjects.forEach(sub => {
    const currentRegularG = activeSemester === 'HK1' ? (sub.regularGrades1 || []) : sub.regularGrades;
    const currentMidG = activeSemester === 'HK1' ? sub.midtermGrade1 : sub.midtermGrade;
    const currentFinalG = activeSemester === 'HK1' ? sub.finalGrade1 : sub.finalGrade;

    const regSum = currentRegularG.reduce((s, g) => s + g.value, 0);
    const midVal = currentMidG ? currentMidG.value : 0;
    const finalVal = currentFinalG ? currentFinalG.value : 0;
    const countReg = currentRegularG.length;
    
    let numerator = 0;
    let denominator = 0;

    if (countReg > 0 || currentMidG || currentFinalG) {
        numerator += regSum;
        denominator += countReg;

        if (currentMidG) {
            numerator += midVal * 2;
            denominator += 2;
        }
        if (currentFinalG) {
            numerator += finalVal * 3;
            denominator += 3;
        }

        if (denominator > 0) {
            const tbm = numerator / denominator;
            totalTbm += tbm;
            tbmList.push(tbm);
            count++;
        }
    }
  });

  const overallAvg = count > 0 ? totalTbm / count : 0;
  
  // Classification Logic (Simplified Circular 22)
  // Xuất sắc: 6 môn >= 9.0, còn lại >= 6.5
  // Giỏi: 6 môn >= 8.0, còn lại >= 6.5
  // Khá: 6 môn >= 6.5, còn lại >= 5.0
  
  let rank = 'Chưa xếp loại';
  let color = 'text-gray-500';
  let bgColor = 'bg-gray-50';

  if (tbmList.length > 0) {
      // Sort descending for easier counting
      const sortedTbm = [...tbmList].sort((a, b) => b - a);
      const minTbm = sortedTbm[sortedTbm.length - 1]; // Lowest score
      
      const count90 = sortedTbm.filter(s => s >= 9.0).length;
      const count80 = sortedTbm.filter(s => s >= 8.0).length;
      const count65 = sortedTbm.filter(s => s >= 6.5).length;

      // Logic check
      // For classification, we usually need enough subjects. 
      // Assuming if they have less than 6 subjects entered, we rely on "all subjects must meet criteria".
      const thresholdCount = Math.min(6, tbmList.length);

      if (count90 >= thresholdCount && minTbm >= 6.5) {
          rank = 'Xuất sắc';
          color = 'text-purple-600';
          bgColor = 'bg-purple-50';
      } else if (count80 >= thresholdCount && minTbm >= 6.5) {
          rank = 'Giỏi';
          color = 'text-emerald-600';
          bgColor = 'bg-emerald-50';
      } else if (count65 >= thresholdCount && minTbm >= 5.0) {
          rank = 'Khá';
          color = 'text-blue-600';
          bgColor = 'bg-blue-50';
      } else if (minTbm >= 3.5) {
          // Fallback logic for Trung Binh/Yeu based on general knowledge since not specified fully
           rank = 'Trung Bình';
           color = 'text-amber-600';
           bgColor = 'bg-amber-50';
      } else {
           rank = 'Yếu';
           color = 'text-red-600';
           bgColor = 'bg-red-50';
      }
  }

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 flex-wrap gap-6 relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-blue-50 blur-3xl opacity-60"></div>
      
      <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <TrendingUp size={28} strokeWidth={2} />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium mb-1 tracking-wide uppercase">Trung bình chung</p>
            <p className="text-4xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">{overallAvg.toFixed(2)}</p>
        </div>
      </div>

      <div className="hidden md:block w-px h-16 bg-gray-100"></div>

      <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
        <div className={`w-14 h-14 ${bgColor} ${color} rounded-2xl flex items-center justify-center border border-current border-opacity-10`}>
            <Award size={28} strokeWidth={2} />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium mb-1 tracking-wide uppercase">Dự kiến xếp loại</p>
            <p className={`text-3xl font-extrabold tracking-tight ${color}`}>{rank}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsBoard;