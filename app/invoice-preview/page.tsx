'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface InvoiceConfig {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  companyLogo: string;
  vatRate: number;
  invoicePrefix: string;
  invoiceFooter: string;
}

export default function InvoicePreviewPage() {
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfig>({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    companyLogo: '',
    vatRate: 10,
    invoicePrefix: 'INV-',
    invoiceFooter: 'Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!'
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // Dữ liệu mẫu cho hóa đơn
  const sampleInvoice = {
    invoiceNumber: `${invoiceConfig.invoicePrefix}00001`,
    date: new Date().toLocaleDateString('vi-VN'),
    customer: {
      name: 'Nguyễn Văn A',
      phone: '0987654321',
      email: 'nguyenvana@example.com'
    },
    items: [
      {
        description: 'Chụp ảnh cá nhân',
        quantity: 1,
        price: 1000000,
        total: 1000000
      },
      {
        description: 'Chỉnh sửa ảnh',
        quantity: 10,
        price: 50000,
        total: 500000
      }
    ],
    subtotal: 1500000,
    vat: 1500000 * (invoiceConfig.vatRate / 100),
    deposit: 500000,
    total: 1500000 + (1500000 * (invoiceConfig.vatRate / 100)),
    remaining: 1500000 + (1500000 * (invoiceConfig.vatRate / 100)) - 500000
  };

  // Lấy cấu hình hóa đơn từ localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('invoiceConfig');
    if (savedConfig) {
      setInvoiceConfig(JSON.parse(savedConfig));
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Xem trước hóa đơn</h1>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          In hóa đơn
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {invoiceConfig.companyLogo && (
              <div className="mb-2">
                <img 
                  src={invoiceConfig.companyLogo} 
                  alt={invoiceConfig.companyName} 
                  className="h-16 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <h2 className="text-xl font-bold">{invoiceConfig.companyName || 'Tên công ty'}</h2>
            <p className="text-gray-600">{invoiceConfig.companyAddress || 'Địa chỉ công ty'}</p>
            <p className="text-gray-600">{invoiceConfig.companyPhone || 'Số điện thoại'}</p>
            <p className="text-gray-600">{invoiceConfig.companyEmail || 'Email công ty'}</p>
            <p className="text-gray-600">{invoiceConfig.companyWebsite || 'Website công ty'}</p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-800">HÓA ĐƠN</h1>
            <p className="text-gray-600">Số: {sampleInvoice.invoiceNumber}</p>
            <p className="text-gray-600">Ngày: {sampleInvoice.date}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Thông tin khách hàng</h3>
          <p><span className="font-medium">Tên:</span> {sampleInvoice.customer.name}</p>
          <p><span className="font-medium">Số điện thoại:</span> {sampleInvoice.customer.phone}</p>
          <p><span className="font-medium">Email:</span> {sampleInvoice.customer.email}</p>
        </div>

        {/* Items */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left border">Mô tả</th>
                <th className="py-2 px-4 text-center border">Số lượng</th>
                <th className="py-2 px-4 text-right border">Đơn giá</th>
                <th className="py-2 px-4 text-right border">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {sampleInvoice.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 px-4 border">{item.description}</td>
                  <td className="py-2 px-4 text-center border">{item.quantity}</td>
                  <td className="py-2 px-4 text-right border">{item.price.toLocaleString('vi-VN')}đ</td>
                  <td className="py-2 px-4 text-right border">{item.total.toLocaleString('vi-VN')}đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span className="font-medium">Tổng cộng:</span>
              <span>{sampleInvoice.subtotal.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium">VAT ({invoiceConfig.vatRate}%):</span>
              <span>{sampleInvoice.vat.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium">Đã đặt cọc:</span>
              <span>{sampleInvoice.deposit.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-300 font-bold">
              <span>Tổng thanh toán:</span>
              <span>{sampleInvoice.total.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between py-2 text-red-600 font-bold">
              <span>Còn lại:</span>
              <span>{sampleInvoice.remaining.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="mb-8 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Thông tin thanh toán</h3>
          <p><span className="font-medium">Phương thức thanh toán:</span> Chuyển khoản</p>
          <p><span className="font-medium">Tên tài khoản:</span> {invoiceConfig.companyName || 'Tên công ty'}</p>
          <p><span className="font-medium">Số tài khoản:</span> 1234567890</p>
          <p><span className="font-medium">Ngân hàng:</span> Vietcombank</p>
          <p><span className="font-medium">Nội dung:</span> {sampleInvoice.invoiceNumber} - {sampleInvoice.customer.name}</p>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 text-sm">
          <p>{invoiceConfig.invoiceFooter}</p>
        </div>
      </div>
    </div>
  );
}
