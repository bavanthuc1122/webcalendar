'use client';

import { useState, useRef } from 'react';
import Toast from './Toast';
import PaymentSettings from './PaymentSettings';

interface InvoiceMakerProps {
  bookingData: {
    customer: string;
    time: string;
    duration: number;
    date: string;
    phone: string;
    deposit: number;
    total: number;
    concepts?: string;
  };
  onSuccess?: (pdfUrl: string) => void;
}

// Mẫu hóa đơn
const INVOICE_TEMPLATES = [
  { id: 1, name: 'Mẫu cơ bản', thumbnail: '/templates/basic.jpg', description: 'Mẫu hóa đơn đơn giản với thông tin cơ bản' },
  { id: 2, name: 'Mẫu hiện đại', thumbnail: '/templates/modern.jpg', description: 'Mẫu hóa đơn với thiết kế hiện đại' },
  { id: 3, name: 'Mẫu sang trọng', thumbnail: '/templates/luxury.jpg', description: 'Mẫu hóa đơn với thiết kế sang trọng' },
  { id: 4, name: 'Mẫu tối giản', thumbnail: '/templates/minimal.jpg', description: 'Mẫu hóa đơn với thiết kế tối giản' },
  { id: 5, name: 'Mẫu sáng tạo', thumbnail: '/templates/creative.jpg', description: 'Mẫu hóa đơn với thiết kế sáng tạo' },
  { id: 6, name: 'Mẫu chuyên nghiệp', thumbnail: '/templates/professional.jpg', description: 'Mẫu hóa đơn với thiết kế chuyên nghiệp' },
  { id: 7, name: 'Mẫu doanh nghiệp', thumbnail: '/templates/business.jpg', description: 'Mẫu hóa đơn dành cho doanh nghiệp' },
];

export default function InvoiceMaker({ bookingData, onSuccess }: InvoiceMakerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
  const [logo, setLogo] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState<string>('#FF5A5F');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [paymentInfo, setPaymentInfo] = useState<string>('');
  const [showPaymentSettings, setShowPaymentSettings] = useState<boolean>(false);
  const [bankInfo, setBankInfo] = useState<{
    bankName: string;
    accountNumber: string;
    accountName: string;
    branch?: string;
    description?: string;
  } | null>(null);
  const [toast, setToast] = useState({
    message: '',
    type: 'success' as 'success' | 'error',
    isVisible: false
  });
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Tải lên logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogo(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Tải lên mã QR thanh toán
  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setQrCode(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Lưu thông tin thanh toán
  const handlePaymentInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPaymentInfo(e.target.value);
  };

  // Hiển thị/ẩn cài đặt thanh toán
  const togglePaymentSettings = () => {
    setShowPaymentSettings(!showPaymentSettings);
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      // Gửi dữ liệu đến API để tạo PDF
      const response = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingData,
          templateId: selectedTemplate,
          logo,
          qrCode,
          accentColor,
          paymentInfo,
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể tạo hóa đơn PDF');
      }

      const data = await response.json();

      setToast({
        message: 'Đã tạo hóa đơn PDF thành công!',
        type: 'success',
        isVisible: true
      });

      if (onSuccess) onSuccess(data.pdfUrl);
    } catch (error) {
      console.error('Lỗi khi tạo hóa đơn PDF:', error);
      setToast({
        message: 'Có lỗi xảy ra khi tạo hóa đơn PDF',
        type: 'error',
        isVisible: true
      });
    } finally {
      setIsGenerating(false);
    }
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

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Chọn mẫu hóa đơn</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {INVOICE_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className={`relative cursor-pointer transition-transform duration-200 hover:scale-105 ${
                selectedTemplate === template.id ? 'ring-2 ring-[#FF5A5F]' : 'ring-1 ring-gray-200'
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded overflow-hidden">
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x120?text=Template';
                  }}
                />
                {selectedTemplate === template.id && (
                  <div className="absolute inset-0 bg-[#FF5A5F] bg-opacity-20 flex items-center justify-center">
                    <div className="bg-white rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FF5A5F]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-2">
                <div className="text-sm font-medium">{template.name}</div>
                <p className="text-xs text-gray-500 line-clamp-1">{template.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Tùy chỉnh hóa đơn</h3>
          <div className="flex space-x-2">
            <PaymentSettings
              onSave={(paymentInfo, qrDataURL) => {
                setBankInfo(paymentInfo);
                setQrCode(qrDataURL);
                setPaymentInfo(`${paymentInfo.bankName}\nSố TK: ${paymentInfo.accountNumber}\nChủ TK: ${paymentInfo.accountName}${paymentInfo.branch ? '\nChi nhánh: ' + paymentInfo.branch : ''}`);
                setToast({
                  message: 'Đã lưu thông tin thanh toán',
                  type: 'success',
                  isVisible: true
                });
              }}
              initialPaymentInfo={bankInfo || undefined}
            />
            <button
              type="button"
              onClick={togglePaymentSettings}
              className="text-sm text-gray-600 hover:text-[#FF5A5F] flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {showPaymentSettings ? 'Ẩn thông tin thanh toán' : 'Hiện thông tin thanh toán'}
            </button>
          </div>
        </div>
      </div>

      {showPaymentSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Thông tin thanh toán</h4>
          <div className="space-y-4">
            <div>
              <label htmlFor="paymentInfo" className="block text-sm font-medium text-gray-700 mb-1">
                Thông tin chuyển khoản
              </label>
              <textarea
                id="paymentInfo"
                className="w-full h-20 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                placeholder="Nhập thông tin chuyển khoản (số tài khoản, ngân hàng, chủ tài khoản...)"
                value={paymentInfo}
                onChange={handlePaymentInfoChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Sử dụng nút "Cài đặt thanh toán" để tạo mã QR tự động từ thông tin ngân hàng.
              </p>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã QR thanh toán
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF5A5F] transition-colors"
                  onClick={() => qrInputRef.current?.click()}
                >
                  {qrCode ? (
                    <div className="relative w-full h-40">
                      <img
                        src={qrCode}
                        alt="QR Code"
                        className="object-contain w-full h-full"
                      />
                      <button
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQrCode(null);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <p className="mt-2 text-xs text-gray-500">Nhấp để tải lên mã QR thanh toán</p>
                    </>
                  )}
                  <input
                    type="file"
                    ref={qrInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg"
                    onChange={handleQRUpload}
                  />
                </div>
              </div>

              {bankInfo && (
                <div className="flex-1 p-3 bg-white rounded-lg border border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Thông tin đã lưu</h5>
                  <ul className="text-xs space-y-1 text-gray-600">
                    <li><span className="font-medium">Ngân hàng:</span> {bankInfo.bankName}</li>
                    <li><span className="font-medium">Số TK:</span> {bankInfo.accountNumber}</li>
                    <li><span className="font-medium">Chủ TK:</span> {bankInfo.accountName}</li>
                    {bankInfo.branch && <li><span className="font-medium">Chi nhánh:</span> {bankInfo.branch}</li>}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Tải lên logo</h3>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF5A5F] transition-colors"
            onClick={() => logoInputRef.current?.click()}
          >
            {logo ? (
              <div className="relative w-full h-40">
                <img
                  src={logo}
                  alt="Logo"
                  className="object-contain w-full h-full"
                />
                <button
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLogo(null);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">Nhấp để tải lên logo (PNG, JPG)</p>
              </>
            )}
            <input
              type="file"
              ref={logoInputRef}
              className="hidden"
              accept="image/png, image/jpeg"
              onChange={handleLogoUpload}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Chọn màu chủ đạo</h3>
          <div className="flex flex-wrap gap-3">
            {['#FF5A5F', '#00A699', '#FC642D', '#484848', '#767676', '#3B5998', '#1DA1F2'].map((color) => (
              <div
                key={color}
                className={`w-10 h-10 rounded-full cursor-pointer ${
                  accentColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setAccentColor(color)}
              />
            ))}
            <div className="flex items-center">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-10 h-10 rounded-full cursor-pointer border-0 p-0 m-0"
              />
              <span className="ml-2 text-sm text-gray-500">Tùy chỉnh</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-medium mb-2">Xem trước hóa đơn</h3>
        <div className="aspect-w-16 aspect-h-9 bg-white rounded shadow-sm overflow-hidden">
          <div className="p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                {logo && <img src={logo} alt="Logo" className="h-12 object-contain mb-2" />}
                <h2 className="text-xl font-bold" style={{ color: accentColor }}>HÓA ĐƠN</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Ngày: {bookingData.date}</p>
                <p className="text-sm text-gray-500">Mã: INV-{Math.floor(Math.random() * 10000)}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Khách hàng:</p>
                <p className="font-medium">{bookingData.customer}</p>
                <p>{bookingData.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Chi tiết:</p>
                <p>Ngày chụp: {bookingData.date}</p>
                <p>Thời gian: {bookingData.time} ({bookingData.duration} giờ)</p>
              </div>
            </div>

            <div className="mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `2px solid ${accentColor}` }}>
                    <th className="text-left py-2">Dịch vụ</th>
                    <th className="text-right py-2">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2">Dịch vụ chụp ảnh ({bookingData.duration} giờ)</td>
                    <td className="text-right py-2">{bookingData.total.toLocaleString('vi-VN')}đ</td>
                  </tr>
                  {bookingData.concepts && (
                    <tr>
                      <td className="py-2">Concept: {bookingData.concepts}</td>
                      <td className="text-right py-2">-</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '1px solid #eee' }}>
                    <th className="text-left py-2">Đã đặt cọc</th>
                    <td className="text-right py-2">{bookingData.deposit.toLocaleString('vi-VN')}đ</td>
                  </tr>
                  <tr style={{ borderTop: `2px solid ${accentColor}` }}>
                    <th className="text-left py-2">Còn lại</th>
                    <td className="text-right py-2 font-bold" style={{ color: accentColor }}>
                      {(bookingData.total - bookingData.deposit).toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Hiển thị thông tin thanh toán và mã QR nếu có */}
              {(paymentInfo || qrCode) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-col md:flex-row">
                    {paymentInfo && (
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700 mb-1">Thông tin thanh toán:</p>
                        <p className="text-sm whitespace-pre-line">{paymentInfo}</p>
                      </div>
                    )}
                    {qrCode && (
                      <div className="mt-3 md:mt-0 md:ml-4 flex-shrink-0">
                        <img src={qrCode} alt="QR thanh toán" className="h-24 object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleGeneratePDF}
        disabled={isGenerating}
        className="w-full bg-[#FF5A5F] text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 flex items-center justify-center"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang tạo PDF...
          </>
        ) : (
          'Tạo hóa đơn PDF'
        )}
      </button>
    </div>
  );
}
