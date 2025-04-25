'use client';

import { useState } from 'react';
import { google } from 'googleapis';
import Toast from './Toast';
import AuthGuide from './AuthGuide';

interface CalendarAddButtonProps {
  eventData: {
    customer: string;
    time: string;
    duration: number;
    date: string;
    phone: string;
    deposit: number;
    total: number;
    concepts?: string;
  };
  onSuccess?: () => void;
}

export default function CalendarAddButton({ eventData, onSuccess }: CalendarAddButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({
    message: '',
    type: 'success' as 'success' | 'error',
    isVisible: false
  });

  const handleAddToCalendar = async () => {
    setIsLoading(true);
    try {
      // Chuẩn bị dữ liệu sự kiện
      const { customer, time, duration, date, phone, deposit, total, concepts } = eventData;

      // Chuyển đổi ngày và giờ thành đối tượng Date
      const [day, month, year] = date.split('/').map(Number);
      const [hour, minute] = time.split(':').map(Number);

      const startDate = new Date(year, month - 1, day, hour, minute);
      const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);

      // Tạo mô tả sự kiện
      const description = `
        Số điện thoại: ${phone}
        Tiền đặt cọc: ${deposit.toLocaleString('vi-VN')}đ
        Tổng chi phí: ${total.toLocaleString('vi-VN')}đ
        ${concepts ? `Ý tưởng chụp: ${concepts}` : ''}
      `;

      // Gọi API để thêm sự kiện vào Google Calendar
      const response = await fetch('/api/add-to-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: `Chụp ảnh: ${customer}`,
          description: description.trim(),
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể thêm sự kiện vào lịch');
      }

      const result = await response.json();

      setToast({
        message: 'Đã thêm sự kiện vào Google Calendar!',
        type: 'success',
        isVisible: true
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Lỗi khi thêm sự kiện vào lịch:', error);
      setToast({
        message: 'Có lỗi xảy ra khi thêm sự kiện vào lịch',
        type: 'error',
        isVisible: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDetails = () => {
    // Xử lý khi người dùng muốn chỉnh sửa chi tiết
    // Có thể thực hiện bằng cách gọi một callback từ props
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
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Thêm vào Google Calendar</h3>
          <AuthGuide type="google" />
        </div>

        <div className="space-y-3">
          <button
            onClick={handleAddToCalendar}
            disabled={isLoading}
            className="w-full bg-[#FF5A5F] text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang thêm vào lịch...
              </>
            ) : (
              'Thêm vào Google Calendar'
            )}
          </button>
          <button
            onClick={handleEditDetails}
            className="w-full text-gray-600 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            Chỉnh sửa chi tiết
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-600">
              Sự kiện sẽ được thêm vào Google Calendar của bạn với tiêu đề "{eventData.customer}", thời gian từ {eventData.time} đến {eventData.time.split(':')[0]}:{parseInt(eventData.time.split(':')[1]) + eventData.duration * 60} ngày {eventData.date}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
