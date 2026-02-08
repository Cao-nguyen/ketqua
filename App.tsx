import React, { useState } from 'react';
import { GradeProvider, useGrade } from './context/GradeContext';
import Header from './components/Header';
import SubjectRow from './components/SubjectRow';
import StatsBoard from './components/StatsBoard';
import { Plus } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { subjects, addSubject } = useGrade();
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubjectName.trim()) {
      addSubject(newSubjectName.trim());
      setNewSubjectName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Header />
      
      <main className="container mx-auto px-4 flex-grow max-w-5xl pt-8">
        
        <StatsBoard />

        <div className="flex justify-between items-end mb-4">
            <h2 className="text-gray-700 font-bold text-lg">Danh sách môn học ({subjects.length})</h2>
            {!isAdding ? (
                <button 
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm hover:shadow"
                >
                    <Plus size={18} />
                    Thêm môn học
                </button>
            ) : (
                <form onSubmit={handleAddSubject} className="flex gap-2 animate-fade-in-right">
                    <input 
                        type="text" 
                        placeholder="Tên môn học..." 
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white placeholder-gray-400"
                        autoFocus
                    />
                    <button 
                        type="submit"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                        Lưu
                    </button>
                    <button 
                        type="button"
                        onClick={() => setIsAdding(false)}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                    >
                        Hủy
                    </button>
                </form>
            )}
        </div>

        {subjects.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="text-gray-400 mb-4">Chưa có môn học nào được thêm.</div>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="text-indigo-600 font-medium hover:underline"
                >
                    Thêm môn học đầu tiên
                </button>
            </div>
        ) : (
            <div className="space-y-4">
                {subjects.map(sub => (
                    <SubjectRow key={sub.id} subject={sub} />
                ))}
            </div>
        )}
      </main>

      <footer className="mt-12 text-center text-gray-400 text-sm py-6">
        <p>&copy; 2026 Grade Master. Tự động lưu dữ liệu vào trình duyệt.</p>
        <p className="text-xs mt-1">Công thức: Tự động điều chỉnh theo hệ số TX:1, GK:2, CK:3</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GradeProvider>
      <Dashboard />
    </GradeProvider>
  );
};

export default App;