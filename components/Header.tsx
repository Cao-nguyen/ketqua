import React, { useState } from 'react';
import { BookOpen, Download, Settings, Cloud, RefreshCw, CheckCircle, AlertCircle, CalendarRange } from 'lucide-react';
import { useGrade } from '../context/GradeContext';
import { exportToCSV, loadData } from '../services/storageService';
import SettingsModal from './SettingsModal';
import ScheduleModal from './ScheduleModal';

const Header: React.FC = () => {
  const { sheetUrl, setSheetUrl, syncStatus, forceSync, forceLoad } = useGrade();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  
  const handleExport = () => {
    const data = loadData();
    exportToCSV(data);
  };

  const getSyncIcon = () => {
    switch (syncStatus) {
        case 'syncing': return <RefreshCw size={18} className="animate-spin" />;
        case 'saved': return <CheckCircle size={18} className="text-emerald-200" />;
        case 'error': return <AlertCircle size={18} className="text-red-300" />;
        default: return <Cloud size={18} />;
    }
  };

  const getSyncText = () => {
    switch (syncStatus) {
        case 'syncing': return 'Đang lưu...';
        case 'saved': return 'Đã lưu';
        case 'error': return 'Lỗi lưu';
        default: return 'Lưu Cloud';
    }
  };

  return (
    <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
                <BookOpen size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-tight">GradeMaster</h1>
                <p className="text-indigo-200 text-xs hidden sm:block">Quản lý điểm số học sinh</p>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            {/* Sync Controls */}
            {sheetUrl && (
                 <div className="flex items-center gap-1 bg-indigo-800/50 rounded-lg p-1 mr-2 border border-indigo-500/30">
                     <button
                        onClick={forceLoad}
                        className="p-2 hover:bg-indigo-700 rounded-md transition text-indigo-200 hover:text-white"
                        title="Tải lại từ Google Sheet"
                     >
                        <Download size={16} />
                     </button>
                     <div className="w-px h-4 bg-indigo-500/50 mx-1"></div>
                     <button 
                        onClick={forceSync}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-indigo-700 rounded-md transition text-xs font-medium"
                        title="Lưu ngay lập tức"
                     >
                        {getSyncIcon()}
                        <span className="hidden sm:inline">{getSyncText()}</span>
                     </button>
                 </div>
            )}

            <button
                onClick={() => setIsScheduleOpen(true)}
                className="flex items-center gap-2 bg-indigo-500/50 hover:bg-indigo-500 px-3 py-2 rounded-lg text-sm font-medium transition"
                title="Thời khóa biểu"
            >
                <CalendarRange size={18} />
                <span className="hidden lg:inline">TKB</span>
            </button>

            <button 
                onClick={handleExport}
                className="hidden md:flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-lg text-sm font-medium transition"
                title="Xuất bảng điểm ra CSV"
            >
                <Download size={18} />
                <span className="hidden lg:inline">Xuất CSV</span>
            </button>

            <button
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 rounded-lg transition ${sheetUrl ? 'bg-indigo-700 text-white' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}
                title="Cài đặt kết nối"
            >
                <Settings size={20} />
            </button>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        currentUrl={sheetUrl}
        onSaveUrl={setSheetUrl}
      />

      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
      />
    </header>
  );
};

export default Header;