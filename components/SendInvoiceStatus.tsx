'use client';

import { useState, useEffect } from 'react';
import AuthGuide from './AuthGuide';

interface SendInvoiceStatusProps {
  pdfUrl: string;
  phone: string;
  onSuccess?: () => void;
}

interface StatusItem {
  id: string;
  label: string;
  status: 'pending' | 'success' | 'error';
  timestamp?: Date;
}

export default function SendInvoiceStatus({ pdfUrl, phone, onSuccess }: SendInvoiceStatusProps) {
  const [statuses, setStatuses] = useState<StatusItem[]>([
    { id: 'generated', label: 'Đã tạo hóa đơn', status: 'success', timestamp: new Date() },
    { id: 'sent', label: 'Đã gửi qua Zalo', status: 'pending' },
  ]);
  const [isSending, setIsSending] = useState<boolean>(false);

  useEffect(() => {
    // Tự động gửi qua Zalo khi component được tạo
    handleSendViaZalo();
  }, []);

  const updateStatus = (id: string, status: 'pending' | 'success' | 'error') => {
    setStatuses(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status, timestamp: status === 'success' ? new Date() : item.timestamp }
          : item
      )
    );
  };

  const handleSendViaZalo = async () => {
    setIsSending(true);
    updateStatus('sent', 'pending');

    try {
      // Gọi API để gửi hóa đơn qua Zalo
      const response = await fetch('/api/send-via-zalo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfUrl,
          phone,
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể gửi hóa đơn qua Zalo');
      }

      updateStatus('sent', 'success');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Lỗi khi gửi hóa đơn qua Zalo:', error);
      updateStatus('sent', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return (
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'success':
        return (
          <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Trạng thái gửi hóa đơn</h3>
        <AuthGuide type="zalo" />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <ul className="space-y-4">
          {statuses.map((item) => (
            <li key={item.id} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getStatusIcon(item.status)}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.label}</p>
                {item.timestamp && (
                  <p className="text-sm text-gray-500">
                    {item.timestamp.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                )}
              </div>
              {item.id === 'sent' && item.status !== 'pending' && (
                <button
                  onClick={handleSendViaZalo}
                  disabled={isSending}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  Gửi lại
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Xem hóa đơn
            </a>

            <button
              onClick={handleSendViaZalo}
              disabled={isSending}
              className="inline-flex items-center px-3 py-1 text-sm bg-[#0068FF] text-white rounded hover:bg-opacity-90 transition-colors"
            >
              {isSending ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-6h2v6zm4 0h-2v-6h2v6z" />
                </svg>
              )}
              {isSending ? 'Đang gửi...' : 'Gửi qua Zalo'}
            </button>
          </div>

          <div className="mt-4 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-600">
              Hóa đơn sẽ được gửi qua Zalo đến số điện thoại {phone}. Đảm bảo rằng số điện thoại này đã được đăng ký Zalo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
