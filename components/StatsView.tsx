import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { useGrade } from '../context/GradeContext';
import { SubjectData, GradeType, Grade } from '../types';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const viewAnimateState = {
  opacity: 1,
  scale: 1,
  y: 0
};

const emptyViewState = {
  opacity: 0,
  scale: 0.95,
  y: 10
};

const calcTBM = (sub: SubjectData, activeSemester: 'HK1' | 'HK2'): number => {
    let reg: Grade[] = [];
    let mid: Grade | null = null;
    let fin: Grade | null = null;

    if (activeSemester === 'HK1') {
        reg = sub.regularGrades1 || [];
        mid = sub.midtermGrade1 || null;
        fin = sub.finalGrade1 || null;
    } else {
        reg = sub.regularGrades || [];
        mid = sub.midtermGrade || null;
        fin = sub.finalGrade || null;
    }

    const regSum = reg.reduce((sum, g) => sum + g.value, 0);
    const countReg = reg.length;
    const midVal = mid ? mid.value : 0;
    const finalVal = fin ? fin.value : 0;

    let numerator = 0;
    let denominator = 0;

    if (countReg > 0) {
        numerator += regSum;
        denominator += countReg;
    }
    if (midVal > 0) {
        numerator += midVal * 2;
        denominator += 2;
    }
    if (finalVal > 0) {
        numerator += finalVal * 3;
        denominator += 3;
    }

    if (denominator === 0) return 0;
    return Number((numerator / denominator).toFixed(2));
};

const StatsView: React.FC = () => {
    const { subjects, activeSemester } = useGrade();
    const [chartType, setChartType] = useState<'bar' | 'area'>('bar');

    // Data 1: TBM Overview
    const tbmData = useMemo(() => {
        return subjects.map(sub => {
            const tbm1 = calcTBM(sub, 'HK1');
            const tbm2 = calcTBM(sub, 'HK2');
            
            return {
                name: sub.name,
                HK1: tbm1,
                HK2: tbm2,
                TBM: activeSemester === 'HK1' ? tbm1 : tbm2 // current active semester TBM
            };
        }).filter(d => d.TBM > 0 || d.HK1 > 0 || d.HK2 > 0);
    }, [subjects, activeSemester]);

    // Data 2: Grade distribution
    const distributionData = useMemo(() => {
        let ranges = {
            'Điểm 9-10 (Giỏi)': 0,
            'Điểm 8-9 (Khá)': 0,
            'Điểm 6.5-8 (TB Khá)': 0,
            'Điểm 5-6.5 (TB)': 0,
            'Điểm < 5 (Yếu)': 0
        };

        subjects.forEach(sub => {
            const reg = activeSemester === 'HK1' ? (sub.regularGrades1 || []) : (sub.regularGrades || []);
            const mid = activeSemester === 'HK1' ? sub.midtermGrade1 : sub.midtermGrade;
            const fin = activeSemester === 'HK1' ? sub.finalGrade1 : sub.finalGrade;

            const allGrades = [...reg];
            if (mid) allGrades.push(mid);
            if (fin) allGrades.push(fin);

            allGrades.forEach(g => {
                if (g.value >= 9) ranges['Điểm 9-10 (Giỏi)']++;
                else if (g.value >= 8) ranges['Điểm 8-9 (Khá)']++;
                else if (g.value >= 6.5) ranges['Điểm 6.5-8 (TB Khá)']++;
                else if (g.value >= 5) ranges['Điểm 5-6.5 (TB)']++;
                else ranges['Điểm < 5 (Yếu)']++;
            });
        });

        return Object.entries(ranges).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
    }, [subjects, activeSemester]);

    // Data 3: Detailed Grade Timeline per Subject
    const getGradesTimeline = (subject: SubjectData) => {
        const reg = activeSemester === 'HK1' ? (subject.regularGrades1 || []) : (subject.regularGrades || []);
        // Sort by timestamp
        const sorted = [...reg].sort((a, b) => a.timestamp - b.timestamp);
        return sorted.map((g, i) => ({
            name: `Tx ${i+1}`,
            value: g.value,
            reason: g.reason
        }));
    };

    if (tbmData.length === 0) {
        return (
            <motion.div 
                initial={emptyViewState}
                animate={viewAnimateState}
                exit={emptyViewState}
                className="flex flex-col min-h-full pb-24 items-center justify-center pt-32 px-4"
            >
                 <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Chưa có dữ liệu</h2>
                    <p className="text-gray-500">Vui lòng nhập điểm để xem biểu đồ thống kê chi tiết.</p>
                 </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={emptyViewState}
            animate={viewAnimateState}
            exit={emptyViewState}
            className="flex flex-col min-h-full pb-24"
        >
            <div className="px-6 pt-12 pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Thống Kê Điểm Số</h1>
                <p className="text-gray-500 mt-2">Tổng quan chi tiết về thành tích học tập của bạn.</p>
            </div>

            <div className="px-4 space-y-6">
                {/* TBM Chart */}
                <div className="bg-white rounded-3xl p-5 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800 text-lg">Trung Bình Môn ({activeSemester})</h3>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button 
                                onClick={() => setChartType('bar')}
                                className={`p-1.5 rounded-lg transition-colors ${chartType === 'bar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                            >
                                <BarChart3 size={18} />
                            </button>
                            <button 
                                onClick={() => setChartType('area')}
                                className={`p-1.5 rounded-lg transition-colors ${chartType === 'area' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                            >
                                <LineChartIcon size={18} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'bar' ? (
                                <BarChart data={tbmData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <RechartsTooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 600 }}
                                    />
                                    <Bar dataKey="TBM" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={30} />
                                </BarChart>
                            ) : (
                                <AreaChart data={tbmData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTbm" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <RechartsTooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 600 }}
                                    />
                                    <Area type="monotone" dataKey="TBM" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTbm)" />
                                </AreaChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Grade Distribution */}
                    {distributionData.length > 0 && (
                        <div className="bg-white rounded-3xl p-5 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                    <PieChartIcon size={18} />
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg">Phổ Điểm</h3>
                            </div>
                            <div className="h-64 w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={distributionData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {distributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 600 }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Timeline per subject */}
                    {subjects.filter(s => getGradesTimeline(s).length >= 2).map((sub, idx) => (
                        <div key={sub.id} className="bg-white rounded-3xl p-5 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <LineChartIcon size={18} />
                                </div>
                                <h3 className="font-bold text-gray-800 text-base flex-1 truncate">{sub.name} - Tiến độ</h3>
                            </div>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={getGradesTimeline(sub)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                        <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                        <RechartsTooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontSize: '13px' }}
                                        />
                                        <Line type="monotone" dataKey="value" stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default StatsView;
