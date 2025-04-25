'use client';

import { useState } from 'react';
import BatchBookingInput from '../../components/BatchBookingInput';
import Toast from '../../components/Toast';
import Link from 'next/link';

// Định nghĩa interface BookingData
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

// Hàm lưu booking vào localStorage
function saveBooking(booking: BookingData) {
  try {
    // Lấy danh sách booking hiện tại từ localStorage
    const bookingsJSON = localStorage.getItem('bookings') || '[]';
    const bookings = JSON.parse(bookingsJSON);

    // Thêm booking mới vào danh sách
    bookings.push({
      ...booking,
      id: Date.now().toString(), // Tạo ID duy nhất
      createdAt: new Date().toISOString() // Thêm thời gian tạo
    });

    // Lưu lại vào localStorage
    localStorage.setItem('bookings', JSON.stringify(bookings));

    return true;
  } catch (error) {
    console.error('Lỗi khi lưu booking:', error);
    return false;
  }
}

export default function BatchBookingPage() {
  const [toast, setToast] = useState({
    message: '',
    type: 'success' as 'success' | 'error',
    isVisible: false
  });
  const [savedCount, setSavedCount] = useState(0);

  const handleAddBookings = (bookings: BookingData[]) => {
    // Lưu tất cả các lịch hẹn
    bookings.forEach(booking => {
      saveBooking(booking);
    });

    setSavedCount(bookings.length);
    setToast({
      message: `Đã lưu ${bookings.length} lịch hẹn thành công!`,
      type: 'success',
      isVisible: true
    });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-4xl mx-auto space-y-6 px-4">
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={closeToast}
        />

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Thêm nhiều lịch hẹn</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại trang chính
          </Link>
        </div>

        <BatchBookingInput onAddBookings={handleAddBookings} />

        {savedCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">Đã lưu {savedCount} lịch hẹn thành công!</p>
                <p className="text-xs text-green-700 mt-1">
                  Bạn có thể quay lại trang chính để xem và quản lý các lịch hẹn đã lưu.
                </p>
              </div>
            </div>
          </div>
        )}

        <footer className="text-center text-sm text-gray-500 mt-8">
          &copy; {new Date().getFullYear()} Web Calendar Booking. Tất cả quyền được bảo lưu.
        </footer>
      </div>
    </div>
  );
}
