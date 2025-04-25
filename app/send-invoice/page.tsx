'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Toast from '../../components/Toast';

export default function SendInvoicePage() {
  const searchParams = useSearchParams();
  const pdfUrl = searchParams.get('pdfUrl');
  const customer = searchParams.get('customer');
  const phone = searchParams.get('phone');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(`Kính gửi ${customer},\n\nCảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Đính kèm là hóa đơn cho buổi chụp ảnh của bạn.\n\nTrân trọng,\nStudio Ảnh`);
  const [toast, setToast] = useState({
    message: '',
    type: 'success' as 'success' | 'error',
    isVisible: false
  });

  const handleSendViaZalo = async () => {
    if (!pdfUrl || !phone) {
      setToast({
        message: 'Thiếu thông tin để gửi hóa đơn',
        type: 'error',
        isVisible: true
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/send-via-zalo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          message,
          pdfUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể gửi hóa đơn qua Zalo');
      }

      setToast({
        message: 'Đã gửi hóa đơn qua Zalo thành công!',
        type: 'success',
        isVisible: true
      });
    } catch (error) {
      console.error('Lỗi khi gửi hóa đơn:', error);
      setToast({
        message: 'Có lỗi xảy ra khi gửi hóa đơn',
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

  if (!pdfUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold mt-4">Không tìm thấy hóa đơn</h2>
            <p className="text-gray-600 mt-2">Vui lòng tạo hóa đơn trước khi gửi.</p>
            <button
              onClick={() => window.close()}
              className="mt-6 w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-all duration-200"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
      
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-3xl">
        <h1 className="text-2xl font-semibold mb-6">Gửi hóa đơn</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium mb-4">Thông tin gửi</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khách hàng
                </label>
                <input
                  type="text"
                  value={customer || ''}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={phone || ''}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Tin nhắn
                </label>
                <textarea
                  id="message"
                  rows={6}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              
              <button
                onClick={handleSendViaZalo}
                disabled={isLoading}
                className="w-full bg-[#0068FF] text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Gửi qua Zalo
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-medium mb-4">Xem trước hóa đơn</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden h-[500px]">
              <iframe 
                src={pdfUrl} 
                className="w-full h-full" 
                title="Xem trước hóa đơn"
              />
            </div>
            
            <div className="mt-4 flex justify-between">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Mở trong tab mới
              </a>
              
              <a
                href={pdfUrl}
                download="hoa-don.pdf"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Tải xuống
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={() => window.close()}
            className="text-gray-600 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
