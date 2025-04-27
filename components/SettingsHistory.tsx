'use client';

import { useState, useEffect } from 'react';
import { useSettingsHistory } from '../lib/hooks/useSettingsHistory';
import Toast from './Toast';

interface SettingsHistoryProps {
  type: string;
  settingId?: string;
  onRestore?: (setting: any) => void;
  onClose: () => void;
}

export default function SettingsHistory({ type, settingId, onRestore, onClose }: SettingsHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);
  const { getHistoryByType, getHistoryBySettingId, restoreMutation } = useSettingsHistory();
  const [toast, setToast] = useState({
    message: '',
    type: 'success' as 'success' | 'error',
    isVisible: false
  });

  // Lấy lịch sử cấu hình
  const { data, isLoading, error, refetch } = settingId
    ? getHistoryBySettingId(settingId, currentPage, 10)
    : getHistoryByType(type, currentPage, 10);

  // Xử lý khi không có dữ liệu
  useEffect(() => {
    if (error) {
      console.error('Lỗi khi lấy lịch sử cấu hình:', error);
      setToast({
        message: `Lỗi khi lấy lịch sử cấu hình: ${error.message}`,
        type: 'error',
        isVisible: true
      });
    }
  }, [error]);

  // Xử lý khi khôi phục cấu hình
  const handleRestore = async (historyId: string) => {
    try {
      await restoreMutation.mutateAsync({ historyId });
      setToast({
        message: 'Đã khôi phục cấu hình thành công!',
        type: 'success',
        isVisible: true
      });

      // Cập nhật lại danh sách lịch sử
      refetch();

      // Gọi callback nếu có
      if (onRestore) {
        onRestore(restoreMutation.data?.setting);
      }
    } catch (error) {
      setToast({
        message: `Lỗi khi khôi phục cấu hình: ${error.message}`,
        type: 'error',
        isVisible: true
      });
    }
  };

  // Định dạng thời gian
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Định dạng loại thay đổi
  const formatChangeType = (changeType: string) => {
    switch (changeType) {
      case 'create':
        return 'Tạo mới';
      case 'update':
        return 'Cập nhật';
      case 'delete':
        return 'Xóa';
      case 'restore':
        return 'Khôi phục';
      default:
        return changeType;
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

      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Lịch sử cấu hình {type}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-grow p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">
              Lỗi: {error.message}
            </div>
          ) : data?.history.length === 0 ? (
            <div className="text-center text-gray-500 p-4">
              Không có lịch sử cấu hình nào.
            </div>
          ) : (
            <div className="space-y-4">
              {data?.history.map((history) => (
                <div
                  key={history._id}
                  className={`border rounded-lg p-4 ${
                    selectedHistory === history._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedHistory(history._id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        history.changeType === 'create' ? 'bg-green-100 text-green-800' :
                        history.changeType === 'update' ? 'bg-blue-100 text-blue-800' :
                        history.changeType === 'delete' ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {formatChangeType(history.changeType)}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {formatDate(history.createdAt)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(history._id);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      disabled={restoreMutation.isLoading}
                    >
                      {restoreMutation.isLoading && selectedHistory === history._id ? (
                        <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                      Khôi phục
                    </button>
                  </div>

                  <div className="mt-2">
                    <div className="bg-gray-50 p-3 rounded-md overflow-x-auto">
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(history.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {data && data.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Trang trước
            </button>

            <span className="text-sm text-gray-600">
              Trang {currentPage} / {data.pagination.totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, data.pagination.totalPages))}
              disabled={currentPage === data.pagination.totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === data.pagination.totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
