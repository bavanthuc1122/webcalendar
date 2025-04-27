'use client';

import { useState, useRef, useEffect } from 'react';
import Toast from './Toast';
import PaymentSettings from './PaymentSettings';
import { useInvoices } from '../lib/hooks/useInvoices';
import { useQuery } from 'react-query';

interface InvoiceMakerProps {
  bookingData: {
    id?: string;
    _id?: string;
    customer: string;
    time: string;
    duration: number;
    date: string;
    phone: string;
    deposit: number;
    total: number;
    concepts?: string;
    customerId?: string;
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
  const { createInvoice, generateInvoiceNumber } = useInvoices();

  // Lấy cấu hình hóa đơn từ API
  const { data: invoiceConfigData } = useQuery(['invoiceConfig'], async () => {
    try {
      const response = await fetch('/api/settings?type=invoice');
      if (!response.ok) {
        throw new Error('Lỗi khi lấy cấu hình hóa đơn');
      }
      return response.json();
    } catch (error) {
      console.error('Lỗi khi lấy cấu hình hóa đơn:', error);
      // Fallback to localStorage if API fails
      const savedConfig = localStorage.getItem('invoiceConfig');
      return savedConfig ? JSON.parse(savedConfig) : null;
    }
  });

  // Lấy cấu hình hóa đơn từ API
  const { data: invoiceSettingsData } = useQuery(['invoiceSettings'], async () => {
    try {
      const response = await fetch('/api/settings?type=invoiceSettings');
      if (!response.ok) {
        throw new Error('Lỗi khi lấy cấu hình hóa đơn');
      }
      return response.json();
    } catch (error) {
      console.error('Lỗi khi lấy cấu hình hóa đơn:', error);
      // Fallback to localStorage if API fails
      const savedSettings = localStorage.getItem('invoiceSettings');
      return savedSettings ? JSON.parse(savedSettings) : null;
    }
  });

  const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
  const [logo, setLogo] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState<string>('#FF5A5F');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [paymentInfo, setPaymentInfo] = useState<string>('');
  const [showPaymentSettings, setShowPaymentSettings] = useState<boolean>(false);
  const [showCustomizeService, setShowCustomizeService] = useState<boolean>(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [customServiceData, setCustomServiceData] = useState({
    serviceName: `Dịch vụ chụp ảnh (${bookingData.duration} giờ)`,
    servicePrice: bookingData.total,
    additionalServices: [] as { name: string; price: number }[]
  });
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

  // Cập nhật state khi có dữ liệu từ API
  useEffect(() => {
    if (invoiceSettingsData) {
      if (invoiceSettingsData.selectedTemplate) {
        setSelectedTemplate(invoiceSettingsData.selectedTemplate);
      }
      if (invoiceSettingsData.logo) {
        setLogo(invoiceSettingsData.logo);
      }
      if (invoiceSettingsData.qrCode) {
        setQrCode(invoiceSettingsData.qrCode);
      }
      if (invoiceSettingsData.accentColor) {
        setAccentColor(invoiceSettingsData.accentColor);
      }
      if (invoiceSettingsData.paymentInfo) {
        setPaymentInfo(invoiceSettingsData.paymentInfo);
      }
      if (invoiceSettingsData.bankInfo) {
        setBankInfo(invoiceSettingsData.bankInfo);
      }
    }
  }, [invoiceSettingsData]);

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

  // Hiển thị/ẩn tùy chỉnh dịch vụ
  const toggleCustomizeService = () => {
    setShowCustomizeService(!showCustomizeService);
  };

  // Cập nhật tên dịch vụ
  const handleServiceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomServiceData(prev => ({
      ...prev,
      serviceName: e.target.value
    }));
  };

  // Cập nhật giá dịch vụ
  const handleServicePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = e.target.value ? parseInt(e.target.value.replace(/\D/g, '')) : 0;
    setCustomServiceData(prev => ({
      ...prev,
      servicePrice: price
    }));
  };

  // Thêm dịch vụ bổ sung
  const handleAddAdditionalService = () => {
    setCustomServiceData(prev => ({
      ...prev,
      additionalServices: [...prev.additionalServices, { name: '', price: 0 }]
    }));
  };

  // Cập nhật dịch vụ bổ sung
  const handleUpdateAdditionalService = (index: number, field: 'name' | 'price', value: string) => {
    setCustomServiceData(prev => {
      const newServices = [...prev.additionalServices];
      if (field === 'name') {
        newServices[index].name = value;
      } else {
        newServices[index].price = value ? parseInt(value.replace(/\D/g, '')) : 0;
      }
      return {
        ...prev,
        additionalServices: newServices
      };
    });
  };

  // Xóa dịch vụ bổ sung
  const handleRemoveAdditionalService = (index: number) => {
    setCustomServiceData(prev => {
      const newServices = [...prev.additionalServices];
      newServices.splice(index, 1);
      return {
        ...prev,
        additionalServices: newServices
      };
    });
  };

  // Tính tổng tiền
  const calculateTotal = () => {
    const serviceTotal = customServiceData.servicePrice;
    const additionalTotal = customServiceData.additionalServices.reduce((sum, service) => sum + service.price, 0);
    return serviceTotal + additionalTotal;
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      // Chuẩn bị dữ liệu booking với thông tin dịch vụ tùy chỉnh nếu có
      const bookingDataToSend = showCustomizeService
        ? {
            ...bookingData,
            customService: {
              name: customServiceData.serviceName,
              price: customServiceData.servicePrice,
              additionalServices: customServiceData.additionalServices,
              total: calculateTotal()
            }
          }
        : bookingData;

      // Gửi dữ liệu đến API để tạo PDF
      const response = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingData: bookingDataToSend,
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
      const pdfUrl = data.pdfUrl;
      const isDataUrl = data.isDataUrl;

      // Lưu URL của PDF đã tạo
      setGeneratedPdfUrl(pdfUrl);

      // Lưu cấu hình hóa đơn vào API
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'invoiceSettings',
            data: {
              selectedTemplate,
              logo,
              qrCode,
              accentColor,
              paymentInfo,
              bankInfo
            },
          }),
        });
      } catch (settingsError) {
        console.error('Lỗi khi lưu cấu hình hóa đơn:', settingsError);
        // Fallback to localStorage
        localStorage.setItem('invoiceSettings', JSON.stringify({
          selectedTemplate,
          logo,
          qrCode,
          accentColor,
          paymentInfo,
          bankInfo
        }));
      }

      // Tạo hóa đơn trong MongoDB
      try {
        const bookingId = bookingData._id || bookingData.id;
        if (bookingId && bookingData.customerId) {
          // Tạo số hóa đơn mới
          const invoiceNumber = await generateInvoiceNumber(invoiceConfigData?.invoicePrefix || 'INV-');

          // Tạo hóa đơn mới
          await createInvoice({
            invoiceNumber,
            bookingId,
            customerId: bookingData.customerId,
            amount: calculateTotal(),
            paidAmount: bookingData.deposit || 0,
            items: [
              {
                description: customServiceData.serviceName,
                quantity: 1,
                unitPrice: customServiceData.servicePrice,
                total: customServiceData.servicePrice
              },
              ...customServiceData.additionalServices.map(service => ({
                description: service.name,
                quantity: 1,
                unitPrice: service.price,
                total: service.price
              }))
            ],
            status: bookingData.deposit >= calculateTotal() ? 'paid' :
                   bookingData.deposit > 0 ? 'partial' : 'unpaid',
            pdfUrl: pdfUrl,
            notes: bookingData.concepts || ''
          });
        }
      } catch (invoiceError) {
        console.error('Lỗi khi tạo hóa đơn trong MongoDB:', invoiceError);
        // Tiếp tục xử lý ngay cả khi có lỗi khi tạo hóa đơn
      }

      setToast({
        message: 'Đã tạo hóa đơn PDF thành công!',
        type: 'success',
        isVisible: true
      });

      // Nếu là Data URL, tạo một Blob và URL tạm thời
      if (isDataUrl && pdfUrl.startsWith('data:application/pdf;base64,')) {
        try {
          const base64Data = pdfUrl.split(',')[1];
          const binaryData = atob(base64Data);
          const byteArray = new Uint8Array(binaryData.length);

          for (let i = 0; i < binaryData.length; i++) {
            byteArray[i] = binaryData.charCodeAt(i);
          }

          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);

          // Lưu Blob URL thay vì Data URL
          setGeneratedPdfUrl(blobUrl);

          if (onSuccess) onSuccess(blobUrl);
        } catch (error) {
          console.error('Lỗi khi xử lý Data URL:', error);
          if (onSuccess) onSuccess(pdfUrl);
        }
      } else {
        if (onSuccess) onSuccess(pdfUrl);
      }
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
                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/200x120?text=${encodeURIComponent(template.name)}`;
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
            <button
              type="button"
              onClick={toggleCustomizeService}
              className="text-sm text-gray-600 hover:text-[#FF5A5F] flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {showCustomizeService ? 'Ẩn tùy chỉnh dịch vụ' : 'Tùy chỉnh dịch vụ'}
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

      {showCustomizeService && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Tùy chỉnh dịch vụ</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 mb-1">
                  Tên dịch vụ
                </label>
                <input
                  type="text"
                  id="serviceName"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                  placeholder="Nhập tên dịch vụ"
                  value={customServiceData.serviceName}
                  onChange={handleServiceNameChange}
                />
              </div>
              <div>
                <label htmlFor="servicePrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Giá dịch vụ
                </label>
                <input
                  type="text"
                  id="servicePrice"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                  placeholder="Nhập giá dịch vụ"
                  value={customServiceData.servicePrice.toLocaleString('vi-VN')}
                  onChange={handleServicePriceChange}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Dịch vụ bổ sung
                </label>
                <button
                  type="button"
                  onClick={handleAddAdditionalService}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm dịch vụ
                </button>
              </div>

              {customServiceData.additionalServices.length > 0 ? (
                <div className="space-y-2">
                  {customServiceData.additionalServices.map((service, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] text-sm"
                        placeholder="Tên dịch vụ bổ sung"
                        value={service.name}
                        onChange={(e) => handleUpdateAdditionalService(index, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        className="w-32 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] text-sm"
                        placeholder="Giá"
                        value={service.price.toLocaleString('vi-VN')}
                        onChange={(e) => handleUpdateAdditionalService(index, 'price', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAdditionalService(index)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Chưa có dịch vụ bổ sung nào</p>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm font-medium">Tổng cộng:</span>
              <span className="text-lg font-bold text-[#FF5A5F]">{calculateTotal().toLocaleString('vi-VN')}đ</span>
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
                    <td className="py-2">{customServiceData.serviceName}</td>
                    <td className="text-right py-2">{customServiceData.servicePrice.toLocaleString('vi-VN')}đ</td>
                  </tr>
                  {customServiceData.additionalServices.map((service, index) => (
                    <tr key={index}>
                      <td className="py-2">{service.name || 'Dịch vụ bổ sung'}</td>
                      <td className="text-right py-2">{service.price.toLocaleString('vi-VN')}đ</td>
                    </tr>
                  ))}
                  {bookingData.concepts && !showCustomizeService && (
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
                      {(showCustomizeService ? calculateTotal() : bookingData.total - bookingData.deposit).toLocaleString('vi-VN')}đ
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

      <div className="flex justify-between items-center mt-6">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => {
              // Hiển thị modal gửi hóa đơn
              if (generatedPdfUrl) {
                window.open(`/send-invoice?pdfUrl=${encodeURIComponent(generatedPdfUrl)}&customer=${encodeURIComponent(bookingData.customer)}&phone=${encodeURIComponent(bookingData.phone)}`, '_blank');
              } else {
                setToast({
                  message: 'Vui lòng tạo hóa đơn trước khi gửi',
                  type: 'error',
                  isVisible: true
                });
              }
            }}
            disabled={!generatedPdfUrl}
            className={`py-2 px-4 rounded-lg flex items-center mr-2 ${
              generatedPdfUrl
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } transition-all duration-200`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Gửi hóa đơn
          </button>
          {generatedPdfUrl && (
            <a
              href={generatedPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-4 rounded-lg flex items-center text-gray-600 border border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Xem hóa đơn
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className="bg-[#FF5A5F] text-white py-2 px-6 rounded-lg hover:bg-opacity-90 transition-all duration-200 flex items-center"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang tạo hóa đơn...
            </>
          ) : (
            'Tạo hóa đơn PDF'
          )}
        </button>
      </div>
    </div>
  );
}
