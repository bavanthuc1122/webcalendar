'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MigratePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const router = useRouter();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const migrateData = async () => {
    try {
      setIsLoading(true);
      addLog('Bắt đầu chuyển đổi dữ liệu từ localStorage sang MongoDB...');

      // Chuyển đổi dữ liệu khách hàng
      const customersData = localStorage.getItem('customers');
      if (customersData) {
        const customers = JSON.parse(customersData);
        addLog(`Tìm thấy ${customers.length} khách hàng trong localStorage`);

        // Tạo map để lưu trữ ID cũ và ID mới của khách hàng
        const customerIdMap = new Map();

        // Chuyển đổi từng khách hàng
        for (const customer of customers) {
          addLog(`Đang chuyển đổi khách hàng: ${customer.name}...`);
          
          const response = await fetch('/api/customers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              notes: customer.notes,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            if (error.error === 'Số điện thoại đã tồn tại') {
              addLog(`Khách hàng ${customer.name} đã tồn tại trong MongoDB`);
            } else {
              throw new Error(`Lỗi khi chuyển đổi khách hàng: ${error.error}`);
            }
          } else {
            const newCustomer = await response.json();
            customerIdMap.set(customer.id, newCustomer._id || newCustomer.id);
            addLog(`Đã chuyển đổi khách hàng: ${customer.name}`);
          }
        }

        // Chuyển đổi dữ liệu đặt lịch
        const bookingsData = localStorage.getItem('bookings');
        if (bookingsData) {
          const bookings = JSON.parse(bookingsData);
          addLog(`Tìm thấy ${bookings.length} đặt lịch trong localStorage`);

          // Chuyển đổi từng đặt lịch
          for (const booking of bookings) {
            addLog(`Đang chuyển đổi đặt lịch: ${booking.customer} - ${booking.date}...`);
            
            // Tìm khách hàng tương ứng
            const customerResponse = await fetch(`/api/customers?phone=${encodeURIComponent(booking.phone)}`);
            const customers = await customerResponse.json();
            
            if (customers && customers.length > 0) {
              const customer = customers[0];
              
              const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  customer: booking.customer,
                  time: booking.time,
                  date: booking.date,
                  duration: booking.duration,
                  deposit: booking.deposit,
                  total: booking.total,
                  phone: booking.phone,
                  concepts: booking.concepts,
                  status: booking.status,
                  calendarEventId: booking.calendarEventId,
                  invoiceUrl: booking.invoiceUrl,
                  paymentStatus: booking.paymentStatus || 'unpaid',
                  customerId: customer._id || customer.id,
                }),
              });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(`Lỗi khi chuyển đổi đặt lịch: ${error.error}`);
              }

              addLog(`Đã chuyển đổi đặt lịch: ${booking.customer} - ${booking.date}`);
            } else {
              addLog(`Không tìm thấy khách hàng cho đặt lịch: ${booking.customer}`);
            }
          }
        }

        // Chuyển đổi cài đặt thanh toán
        const paymentSettingsData = localStorage.getItem('paymentSettings');
        if (paymentSettingsData) {
          const paymentSettings = JSON.parse(paymentSettingsData);
          addLog(`Tìm thấy ${paymentSettings.length} cài đặt thanh toán trong localStorage`);

          // Chuyển đổi từng cài đặt thanh toán
          for (const setting of paymentSettings) {
            addLog(`Đang chuyển đổi cài đặt thanh toán: ${setting.bankName}...`);
            
            const response = await fetch('/api/settings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'payment',
                data: {
                  bankName: setting.bankName,
                  accountNumber: setting.accountNumber,
                  accountName: setting.accountName,
                  branch: setting.branch,
                  qrCodeUrl: setting.qrCodeUrl,
                },
                isDefault: setting.isDefault,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(`Lỗi khi chuyển đổi cài đặt thanh toán: ${error.error}`);
            }

            addLog(`Đã chuyển đổi cài đặt thanh toán: ${setting.bankName}`);
          }
        }

        // Chuyển đổi cài đặt email
        const emailConfigData = localStorage.getItem('emailConfig');
        if (emailConfigData) {
          const emailConfig = JSON.parse(emailConfigData);
          addLog('Tìm thấy cài đặt email trong localStorage');
          
          const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'email',
              data: emailConfig,
              isDefault: true,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Lỗi khi chuyển đổi cài đặt email: ${error.error}`);
          }

          addLog('Đã chuyển đổi cài đặt email');
        }

        // Chuyển đổi cài đặt hóa đơn
        const invoiceConfigData = localStorage.getItem('invoiceConfig');
        if (invoiceConfigData) {
          const invoiceConfig = JSON.parse(invoiceConfigData);
          addLog('Tìm thấy cài đặt hóa đơn trong localStorage');
          
          const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'invoice',
              data: invoiceConfig,
              isDefault: true,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Lỗi khi chuyển đổi cài đặt hóa đơn: ${error.error}`);
          }

          addLog('Đã chuyển đổi cài đặt hóa đơn');
        }

        addLog('Chuyển đổi dữ liệu hoàn tất!');
      } else {
        addLog('Không tìm thấy dữ liệu khách hàng trong localStorage');
      }
    } catch (error) {
      console.error('Lỗi khi chuyển đổi dữ liệu:', error);
      addLog(`Lỗi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chuyển đổi dữ liệu từ localStorage sang MongoDB</h1>
      
      <div className="mb-4">
        <button
          onClick={migrateData}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? 'Đang chuyển đổi...' : 'Bắt đầu chuyển đổi'}
        </button>
        
        <button
          onClick={() => router.push('/')}
          className="ml-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Quay lại trang chủ
        </button>
      </div>
      
      <div className="border rounded p-4 bg-gray-100 h-96 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">Nhật ký chuyển đổi:</h2>
        {logs.length === 0 ? (
          <p className="text-gray-500">Chưa có nhật ký nào.</p>
        ) : (
          <ul className="space-y-1">
            {logs.map((log, index) => (
              <li key={index} className="text-sm">
                {log}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
