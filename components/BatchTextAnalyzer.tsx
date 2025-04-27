'use client';

import { useState } from 'react';
import Toast from './Toast';

interface ParsedData {
  customer: string;
  concepts?: string;
  time: string;
  duration: number;
  deposit: number;
  total: number;
  phone: string;
  date: string;
  status?: string;
}

interface BatchTextAnalyzerProps {
  onAnalyzeComplete: (results: ParsedData[]) => void;
}

export default function BatchTextAnalyzer({ onAnalyzeComplete }: BatchTextAnalyzerProps) {
  const [batchText, setBatchText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState({
    message: '',
    type: 'success' as 'success' | 'error',
    isVisible: false
  });

  const handleAnalyze = async () => {
    if (!batchText.trim()) {
      setToast({
        message: 'Vui lòng nhập thông tin đặt lịch',
        type: 'error',
        isVisible: true
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      if (!batchText.trim()) {
        setToast({
          message: 'Vui lòng nhập thông tin đặt lịch',
          type: 'error',
          isVisible: true
        });
        setIsAnalyzing(false);
        return;
      }

      // Phân tích tất cả các lịch hẹn cùng một lúc
      const response = await fetch('/api/parse-batch-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchText }),
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP: ${response.status}`);
      }

      // Lấy text response trước
      const responseText = await response.text();
      console.log('Response text:', responseText);

      // Thử parse JSON
      let results: ParsedData[];
      try {
        results = JSON.parse(responseText);
        if (!Array.isArray(results)) {
          throw new Error('Kết quả không phải là mảng JSON');
        }
      } catch (jsonError) {
        console.error('Lỗi khi parse JSON từ response:', jsonError);
        console.error('Response text:', responseText);
        throw new Error('Không thể phân tích JSON từ phản hồi');
      }

      // Hiển thị kết quả phân tích
      console.log(`Đã phân tích thành công ${results.length} lịch hẹn:`, results);

      if (results.length > 0) {
        onAnalyzeComplete(results);

        setToast({
          message: `Đã phân tích thành công ${results.length} lịch hẹn`,
          type: 'success',
          isVisible: true
        });

        // Xóa văn bản đã nhập nếu thành công
        setBatchText('');
      } else {
        setToast({
          message: 'Không thể phân tích bất kỳ thông tin đặt lịch nào',
          type: 'error',
          isVisible: true
        });
      }
    } catch (error) {
      console.error('Lỗi khi phân tích hàng loạt:', error);
      setToast({
        message: `Có lỗi xảy ra khi phân tích thông tin đặt lịch: ${error.message}`,
        type: 'error',
        isVisible: true
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  return (
    <div className="space-y-4">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Phân tích nhiều lịch hẹn</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="batchText" className="block text-sm font-medium text-gray-700 mb-1">
              Nhập nhiều thông tin đặt lịch
            </label>
            <textarea
              id="batchText"
              className="w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
              placeholder={`Nhập thông tin nhiều lịch hẹn, mỗi lịch cách nhau bằng 2 dòng trống hoặc dấu gạch ngang (---)\n\nVí dụ 1 - Mỗi lịch trên nhiều dòng:\nKhách hàng: Nguyễn Văn A\nSĐT: 0912345678\nNgày: 25/04/2024\nGiờ: 10:00\nThời lượng: 2 giờ\nĐặt cọc: 500k\nTổng: 2tr\n\n---\n\nKhách hàng: Trần Thị B\nSĐT: 0987654321\nNgày: 26/04/2024\nGiờ: 14:00\nThời lượng: 3 giờ\nĐặt cọc: 700k\nTổng: 3tr\n\nVí dụ 2 - Mỗi lịch trên một dòng:\nHoàng Thùy - Cọc 200k gói 10500k sdt 0988741021 18h - 21h 15.1.2025 Beuaty profile 20 ảnh\nLê Minh - Cọc 500k gói 5000k sdt 0912345678 9h - 11h 20.5.2025 Concept gia đình`}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Mỗi lịch hẹn nên có thông tin về khách hàng, số điện thoại, ngày, giờ, thời lượng, đặt cọc và tổng chi phí.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !batchText.trim()}
              className="bg-[#FF5A5F] text-white py-2 px-6 rounded-lg hover:bg-opacity-90 transition-all duration-200 flex items-center"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang phân tích...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Phân tích tất cả
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
