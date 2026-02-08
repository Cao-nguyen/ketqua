import React, { useState } from 'react';
import { X, Save, Link as LinkIcon, HelpCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onSaveUrl: (url: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentUrl, onSaveUrl }) => {
  const [url, setUrl] = useState(currentUrl);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveUrl(url.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <LinkIcon size={20} /> Kết nối Google Sheet
          </h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="flex items-center gap-2 text-blue-800 font-semibold mb-2">
                <HelpCircle size={16} /> Hướng dẫn cài đặt
            </h4>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                <li>Tạo một Google Sheet mới.</li>
                <li>Vào <strong>Extensions (Tiện ích mở rộng)</strong> &gt; <strong>Apps Script</strong>.</li>
                <li>Dán mã script (được cung cấp bên dưới) vào và lưu lại.</li>
                <li>Chọn <strong>Deploy (Triển khai)</strong> &gt; <strong>New deployment (Tùy chọn triển khai mới)</strong>.</li>
                <li>Chọn loại: <strong>Web app</strong>.</li>
                <li>Who has access (Ai có quyền truy cập): <strong>Anyone (Bất kỳ ai)</strong>.</li>
                <li>Copy URL của Web App và dán vào ô bên dưới.</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Web App URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-mono text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Đóng
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Save size={18} />
              Lưu Cấu Hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;