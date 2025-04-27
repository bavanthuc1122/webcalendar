'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SessionCompletionForm from '../../components/SessionCompletionForm';
import Link from 'next/link';

interface BookingData {
  id: string;
  customer: string;
  phone: string;
  date: string;
  time: string;
  duration: number;
  deposit: number;
  total: number;
  status: string;
  concepts?: string;
  createdAt: string;
  updatedAt: string;
  invoiceUrl?: string;
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Lấy thông tin booking từ localStorage
    const loadBooking = () => {
      setIsLoading(true);
      try {
        if (!bookingId) {
          setError('Không tìm thấy ID booking');
          setIsLoading(false);
          return;
        }

        const bookingsJSON = localStorage.getItem('bookings') || '[]';
        const bookings = JSON.parse(bookingsJSON);
        
        const foundBooking = bookings.find((b: any) => b.id === bookingId);
        
        if (!foundBooking) {
          setError('Không tìm thấy thông tin booking');
          setIsLoading(false);
          return;
        }
        
        setBooking(foundBooking);
      } catch (error) {
        console.error('Lỗi khi tải thông tin booking:', error);
        setError('Có lỗi xảy ra khi tải thông tin booking');
      } finally {
        setIsLoading(false);
      }
    };

    loadBooking();
  }, [bookingId]);

  const handleComplete = () => {
    // Chuyển về trang danh sách khách hàng
    window.location.href = '/customers';
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center">
        <Link href="/customers" className="text-blue-600 hover:text-blue-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại danh sách
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
          <p className="mt-2">
            <Link href="/customers" className="text-red-700 font-medium underline">
              Quay lại danh sách khách hàng
            </Link>
          </p>
        </div>
      ) : booking ? (
        <SessionCompletionForm
          bookingData={booking}
          pdfUrl={booking.invoiceUrl}
          onSuccess={handleComplete}
        />
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p>Không tìm thấy thông tin booking</p>
          <p className="mt-2">
            <Link href="/customers" className="text-yellow-700 font-medium underline">
              Quay lại danh sách khách hàng
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
