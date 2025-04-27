'use client';

import { useState, useRef } from 'react';
import Toast from './Toast';

interface SettingsExportImportProps {
  onClose: () => void;
  onImportSuccess?: () => void;
}

export default function SettingsExportImport({ onClose, onImportSuccess }: SettingsExportImportProps) {
  const [exportType, setExportType] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState({
    message: '',
    type: 'success' as 'success' | 'error',
    isVisible: false
  });

  // Xử lý khi xuất cấu hình
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Tạo URL để download
      const url = `/api/settings/export?type=${exportType === 'all' ? '' : exportType}&all=${exportType === 'all'}`;
      
      // Tạo link tạm thời để download
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-${exportType}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setToast({
        message: 'Đã xuất cấu hình thành công!',
        type: 'success',
        isVisible: true
      });
    } catch (error) {
      console.error('Lỗi khi xuất cấu hình:', error);
      setToast({
        message: `Lỗi khi xuất cấu hình: ${error.message}`,
        type: 'error',
        isVisible: true
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Xử lý khi nhập cấu hình
  const handleImport = async () => {
    if (!fileInputRef.current?.files?.length) {
      setToast({
        message: 'Vui lòng chọn file để nhập',
        type: 'error',
        isVisible: true
      });
      return;
    }

    const file = fileInputRef.current.files[0];
    
    // Kiểm tra định dạng file
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setToast({
        message: 'Vui lòng chọn file JSON',
        type: 'error',
        isVisible: true
      });
      return;
    }

    try {
      setIsImporting(true);
      setImportResult(null);
      
      // Tạo FormData để gửi file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('overwrite', overwrite.toString());
      formData.append('userId', 'user'); // Có thể thay đổi thành ID người dùng thực tế
      
      // Gửi request để nhập cấu hình
      const response = await fetch('/api/settings/import', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi khi nhập cấu hình');
      }
      
      const result = await response.json();
      setImportResult(result);
      
      setToast({
        message: result.message || 'Đã nhập cấu hình thành công!',
        type: 'success',
        isVisible: true
      });
      
      // Gọi callback nếu có
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (error) {
      console.error('Lỗi khi nhập cấu hình:', error);
      setToast({
        message: `Lỗi khi nhập cấu hình: ${error.message}`,
        type: 'error',
        isVisible: true
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Xử lý khi đóng toast
  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
      
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Xuất/Nhập cấu hình</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="space-y-6">
            {/* Phần xuất cấu hình */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Xuất cấu hình</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn loại cấu hình để xuất
                  </label>
                  <select
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tất cả cấu hình</option>
                    <option value="invoice">Cấu hình Hóa đơn</option>
                    <option value="email">Cấu hình Email</option>
                    <option value="payment">Cấu hình Thanh toán</option>
                    <option value="googleSheet">Cấu hình Google Sheet</option>
                    <option value="general">Cấu hình Chung</option>
                  </select>
                </div>
                
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 flex items-center justify-center"
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xuất...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Xuất cấu hình
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Phần nhập cấu hình */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Nhập cấu hình</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn file cấu hình để nhập (.json)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="overwrite"
                    checked={overwrite}
                    onChange={(e) => setOverwrite(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="overwrite" className="ml-2 block text-sm text-gray-700">
                    Ghi đè cấu hình đã tồn tại
                  </label>
                </div>
                
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 flex items-center justify-center"
                >
                  {isImporting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang nhập...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L4 8m4-4v12" />
                      </svg>
                      Nhập cấu hình
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Hiển thị kết quả nhập */}
            {importResult && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Kết quả nhập cấu hình</h3>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showDetails ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                  </button>
                </div>
                
                <div className="text-sm">
                  <p>Tổng số: {importResult.result.total}</p>
                  <p>Đã nhập: {importResult.result.imported}</p>
                  <p>Bỏ qua: {importResult.result.skipped}</p>
                  <p>Lỗi: {importResult.result.errors}</p>
                </div>
                
                {showDetails && importResult.result.details && (
                  <div className="mt-3 bg-white p-3 rounded-md border border-gray-200 max-h-40 overflow-y-auto">
                    <ul className="text-xs space-y-1">
                      {importResult.result.details.map((detail: string, index: number) => (
                        <li key={index} className={`${detail.includes('Lỗi') ? 'text-red-600' : detail.includes('Bỏ qua') ? 'text-yellow-600' : 'text-green-600'}`}>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-all duration-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
