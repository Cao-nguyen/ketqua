import React from 'react';
import { useGrade } from '../context/GradeContext';
import { TrendingUp, Award } from 'lucide-react';

const StatsBoard: React.FC = () => {
  const { subjects } = useGrade();

  if (subjects.length === 0) return null;

  let totalTbm = 0;
  let count = 0;
  const tbmList: number[] = [];

  subjects.forEach(sub => {
    const regSum = sub.regularGrades.reduce((s, g) => s + g.value, 0);
    const midVal = sub.midtermGrade ? sub.midtermGrade.value : 0;
    const finalVal = sub.finalGrade ? sub.finalGrade.value : 0;
    const countReg = sub.regularGrades.length;
    
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
            <TrendingUp size={24} />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">Trung Bình Tất Cả Môn</p>
            <p className="text-2xl font-bold text-gray-800">{overallAvg.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className={`p-3 ${bgColor} ${color} rounded-full`}>
            <Award size={24} />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">Xếp Loại</p>
            <p className={`text-2xl font-bold ${color}`}>{rank}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsBoard;