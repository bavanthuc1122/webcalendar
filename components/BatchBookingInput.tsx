'use client';

import { useState } from 'react';
import Toast from './Toast';

// Định nghĩa interface BookingData nếu chưa có trong lib/db
interface BookingData {
  customer: string;
  phone: string;
  date: string;
  time: string;
  duration: number;
  deposit: number;
  total: number;
  concepts?: string;
  status: string;
}

interface BatchBookingInputProps {
  onAddBookings: (bookings: BookingData[]) => void;
}

export default function BatchBookingInput({ onAddBookings }: BatchBookingInputProps) {
  const [bookingText, setBookingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [toast, setToast] = useState({
    message: '',
    type: 'success' as 'success' | 'error',
    isVisible: false
  });

  const handleAddBooking = () => {
    if (!bookingText.trim()) {
      setToast({
        message: 'Vui lòng nhập thông tin đặt lịch',
        type: 'error',
        isVisible: true
      });
      return;
    }

    setIsLoading(true);

    // Gọi API để phân tích thông tin đặt lịch
    fetch('/api/parse-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: bookingText }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Không thể phân tích thông tin đặt lịch');
        }
        return response.json();
      })
      .then(data => {
        // Thêm booking mới vào danh sách
        const newBooking: BookingData = {
          ...data,
          status: 'pending'
        };

        setBookings(prev => [...prev, newBooking]);
        setBookingText(''); // Xóa text input

        setToast({
          message: 'Đã thêm lịch hẹn vào danh sách',
          type: 'success',
          isVisible: true
        });
      })
      .catch(error => {
        console.error('Lỗi khi phân tích thông tin đặt lịch:', error);
        setToast({
          message: 'Có lỗi xảy ra khi phân tích thông tin đặt lịch',
          type: 'error',
          isVisible: true
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleRemoveBooking = (index: number) => {
    setBookings(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitAll = () => {
    if (bookings.length === 0) {
      setToast({
        message: 'Vui lòng thêm ít nhất một lịch hẹn',
        type: 'error',
        isVisible: true
      });
      return;
    }

    onAddBookings(bookings);
    setBookings([]);
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  return (
    <div className="space-y-6">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Thêm nhiều lịch hẹn</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="bookingText" className="block text-sm font-medium text-gray-700 mb-1">
              Thông tin đặt lịch
            </label>
            <textarea
              id="bookingText"
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
              placeholder="Nhập thông tin đặt lịch (tên khách hàng, ngày, giờ, thời lượng, v.v.)"
              value={bookingText}
              onChange={(e) => setBookingText(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAddBooking}
              disabled={isLoading || !bookingText.trim()}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center"
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
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Thêm vào danh sách
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {bookings.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Danh sách lịch hẹn ({bookings.length})</h2>

          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{booking.customer}</p>
                  <p className="text-sm text-gray-600">
                    Ngày: {booking.date} | Giờ: {booking.time} | Thời lượng: {booking.duration} giờ
                  </p>
                  <p className="text-sm text-gray-600">
                    SĐT: {booking.phone} | Đặt cọc: {booking.deposit.toLocaleString('vi-VN')}đ | Tổng: {booking.total.toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveBooking(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleSubmitAll}
                className="bg-[#FF5A5F] text-white py-2 px-6 rounded-lg hover:bg-opacity-90 transition-all duration-200"
              >
                Lưu tất cả ({bookings.length} lịch)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
