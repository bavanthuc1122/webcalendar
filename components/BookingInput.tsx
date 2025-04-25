'use client';

import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Toast from './Toast';

interface BookingInputProps {
  onParsedData: (data: any) => void;
  onSuccess?: () => void;
}

export default function BookingInput({ onParsedData, onSuccess }: BookingInputProps) {
  const [bookingText, setBookingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({
    message: '',
    type: 'success' as 'success' | 'error',
    isVisible: false
  });
  
  // Khôi phục văn bản đã nhập từ localStorage khi component được tải
  useEffect(() => {
    const savedText = localStorage.getItem('bookingInputText');
    if (savedText) {
      setBookingText(savedText);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingText.trim()) return;

    // Lưu văn bản vào localStorage
    localStorage.setItem('bookingInputText', bookingText);
    
    setIsLoading(true);
    try {
      // Trong môi trường thực tế, API key nên được lưu trong biến môi trường
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Phân tích thông tin đặt lịch sau và trả về dưới dạng JSON:
        ${bookingText}
        
        Trả về JSON với các trường:
        - customer: tên khách hàng
        - concepts: các ý tưởng chụp
        - hours: số giờ chụp
        - deposit: tiền đặt cọc
        - total: tổng chi phí
        - phone: số điện thoại
        - date: ngày chụp (định dạng DD/MM/YYYY)
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Tìm và phân tích phần JSON từ phản hồi
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        onParsedData(parsedData);
        setToast({
          message: 'Phân tích dữ liệu thành công!',
          type: 'success',
          isVisible: true
        });
        if (onSuccess) onSuccess();
      } else {
        throw new Error('Không thể phân tích dữ liệu');
      }
    } catch (error) {
      console.error('Lỗi khi phân tích dữ liệu:', error);
      setToast({
        message: 'Có lỗi xảy ra khi phân tích dữ liệu. Vui lòng thử lại.',
        type: 'error',
        isVisible: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  return (
    <div className="w-full">
      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          className="w-full h-[120px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
          placeholder="Dán thông tin đặt lịch vào đây..."
          value={bookingText}
          onChange={(e) => setBookingText(e.target.value)}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#FF5A5F] text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý...
            </>
          ) : (
            'Gửi'
          )}
        </button>
      </form>
    </div>
  );
}