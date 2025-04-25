'use client';

import { useState, useRef, useEffect } from 'react';
import Toast from './Toast';
import PaymentSettings from './PaymentSettings';

interface InvoicePreviewProps {
  invoiceConfig: {
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyEmail: string;
    companyWebsite: string;
    companyLogo: string;
    vatRate: number;
    invoicePrefix: string;
    invoiceFooter: string;
  };
  onSaveSettings?: (settings: any) => void;
}

// Mẫu hóa đơn từ InvoiceMaker
const INVOICE_TEMPLATES = [
  {
    id: 1,
    name: 'Mẫu cơ bản',
    thumbnail: '/templates/basic.jpg',
    description: 'Mẫu hóa đơn đơn giản với thông tin cơ bản',
    style: {
      headerStyle: 'flex justify-between items-start',
      titleStyle: 'text-xl font-bold',
      borderStyle: '2px solid',
      tableHeaderStyle: 'bg-gray-50 text-left py-2',
      tableRowStyle: 'border-b border-gray-100',
      footerStyle: 'mt-4 text-sm text-gray-500'
    }
  },
  {
    id: 2,
    name: 'Mẫu hiện đại',
    thumbnail: '/templates/modern.jpg',
    description: 'Mẫu hóa đơn với thiết kế hiện đại, phù hợp với studio chuyên nghiệp',
    style: {
      headerStyle: 'flex flex-col md:flex-row justify-between items-center md:items-start',
      titleStyle: 'text-2xl font-bold tracking-tight',
      borderStyle: 'none',
      tableHeaderStyle: 'bg-gray-100 text-left py-3 px-2 rounded-t-lg',
      tableRowStyle: 'border-b border-gray-200 hover:bg-gray-50',
      footerStyle: 'mt-6 text-sm text-gray-600 border-t border-gray-200 pt-4'
    }
  },
  {
    id: 3,
    name: 'Mẫu sang trọng',
    thumbnail: '/templates/luxury.jpg',
    description: 'Mẫu hóa đơn với thiết kế sang trọng, phù hợp với dịch vụ cao cấp',
    style: {
      headerStyle: 'flex justify-between items-start border-b-2 pb-4 mb-6',
      titleStyle: 'text-2xl font-serif font-bold italic',
      borderStyle: '1px solid',
      tableHeaderStyle: 'text-left py-3 border-b-2',
      tableRowStyle: 'border-b border-gray-100',
      footerStyle: 'mt-8 text-sm text-center italic'
    }
  },
  {
    id: 4,
    name: 'Mẫu tối giản',
    thumbnail: '/templates/minimal.jpg',
    description: 'Mẫu hóa đơn với thiết kế tối giản, tập trung vào nội dung',
    style: {
      headerStyle: 'grid grid-cols-2 gap-8',
      titleStyle: 'text-xl font-light uppercase tracking-widest',
      borderStyle: '1px solid',
      tableHeaderStyle: 'text-left py-2 uppercase text-xs tracking-wider',
      tableRowStyle: 'border-t border-gray-100',
      footerStyle: 'mt-8 text-xs text-gray-400'
    }
  },
  {
    id: 5,
    name: 'Mẫu sáng tạo',
    thumbnail: '/templates/creative.jpg',
    description: 'Mẫu hóa đơn với thiết kế sáng tạo, phù hợp với studio nghệ thuật',
    style: {
      headerStyle: 'flex flex-col items-center text-center mb-6',
      titleStyle: 'text-3xl font-bold mt-4',
      borderStyle: '2px dashed',
      tableHeaderStyle: 'text-left py-2 text-lg',
      tableRowStyle: 'border-b border-dotted border-gray-200',
      footerStyle: 'mt-6 text-sm text-center'
    }
  },
  {
    id: 6,
    name: 'Mẫu chuyên nghiệp',
    thumbnail: '/templates/professional.jpg',
    description: 'Mẫu hóa đơn với thiết kế chuyên nghiệp, phù hợp với doanh nghiệp',
    style: {
      headerStyle: 'grid grid-cols-3 gap-4',
      titleStyle: 'text-xl font-bold col-span-3 mb-4 text-center',
      borderStyle: '1px solid',
      tableHeaderStyle: 'bg-gray-800 text-white text-left py-2 px-3',
      tableRowStyle: 'border-b border-gray-200',
      footerStyle: 'mt-6 text-sm bg-gray-50 p-4 rounded'
    }
  },
  {
    id: 7,
    name: 'Mẫu doanh nghiệp',
    thumbnail: '/templates/business.jpg',
    description: 'Mẫu hóa đơn dành cho doanh nghiệp, thiết kế chuyên nghiệp và đầy đủ',
    style: {
      headerStyle: 'flex justify-between items-start',
      titleStyle: 'text-2xl font-bold text-center w-full border-b-2 pb-2 mb-4',
      borderStyle: '1px solid',
      tableHeaderStyle: 'bg-blue-50 text-left py-2 px-3',
      tableRowStyle: 'border-b border-gray-100',
      footerStyle: 'mt-6 text-sm border-t-2 pt-4'
    }
  },
  {
    id: 8,
    name: 'Mẫu studio ảnh',
    thumbnail: '/templates/photo.jpg',
    description: 'Mẫu hóa đơn thiết kế riêng cho studio chụp ảnh',
    style: {
      headerStyle: 'flex flex-col md:flex-row justify-between items-center md:items-start',
      titleStyle: 'text-2xl font-bold text-center',
      borderStyle: 'none',
      tableHeaderStyle: 'text-left py-2 border-b-2',
      tableRowStyle: 'border-b border-gray-100',
      footerStyle: 'mt-6 text-sm'
    }
  },
  {
    id: 9,
    name: 'Mẫu thương mại',
    thumbnail: '/templates/commercial.jpg',
    description: 'Mẫu hóa đơn thương mại, phù hợp với các dịch vụ bán lẻ',
    style: {
      headerStyle: 'grid grid-cols-2 gap-4',
      titleStyle: 'text-xl font-bold bg-gray-100 p-2 text-center rounded',
      borderStyle: '1px solid',
      tableHeaderStyle: 'bg-gray-100 text-left py-2 px-2',
      tableRowStyle: 'border-b border-gray-200',
      footerStyle: 'mt-4 text-sm bg-gray-50 p-3 rounded'
    }
  },
  {
    id: 10,
    name: 'Mẫu cao cấp',
    thumbnail: '/templates/premium.jpg',
    description: 'Mẫu hóa đơn cao cấp, thiết kế sang trọng và chuyên nghiệp',
    style: {
      headerStyle: 'flex justify-between items-start border-b border-gray-200 pb-6 mb-6',
      titleStyle: 'text-3xl font-light',
      borderStyle: 'none',
      tableHeaderStyle: 'text-left py-3 uppercase text-xs tracking-wider',
      tableRowStyle: 'border-b border-gray-100',
      footerStyle: 'mt-8 text-sm text-gray-500'
    }
  }
];

export default function InvoicePreview({ invoiceConfig, onSaveSettings }: InvoicePreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
  const [logo, setLogo] = useState<string | null>(invoiceConfig.companyLogo || null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState<string>('#FF5A5F');
  const [paymentInfo, setPaymentInfo] = useState<string>('');
  const [showPaymentSettings, setShowPaymentSettings] = useState<boolean>(false);
  const [showCustomizeService, setShowCustomizeService] = useState<boolean>(false);
  const [invoiceTitle, setInvoiceTitle] = useState<string>('HÓA ĐƠN DỊCH VỤ');
  const [customServiceData, setCustomServiceData] = useState({
    serviceName: `Dịch vụ chụp ảnh (2 giờ)`,
    servicePrice: 1500000,
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

  // Tải cấu hình hóa đơn từ localStorage khi component được tải
  useEffect(() => {
    const savedSettings = localStorage.getItem('invoiceSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.selectedTemplate) setSelectedTemplate(settings.selectedTemplate);
        if (settings.logo) setLogo(settings.logo);
        if (settings.qrCode) setQrCode(settings.qrCode);
        if (settings.accentColor) setAccentColor(settings.accentColor);
        if (settings.paymentInfo) setPaymentInfo(settings.paymentInfo);
        if (settings.invoiceTitle) setInvoiceTitle(settings.invoiceTitle);
        if (settings.customServiceData) setCustomServiceData(settings.customServiceData);
        if (settings.bankInfo) setBankInfo(settings.bankInfo);
      } catch (error) {
        console.error('Lỗi khi tải cấu hình hóa đơn:', error);
      }
    }
  }, []);

  // Dữ liệu mẫu cho hóa đơn
  const sampleBookingData = {
    customer: 'Nguyễn Văn A',
    phone: '0987654321',
    date: '15/05/2023',
    time: '10:00',
    duration: 2,
    deposit: 500000,
    total: 1500000,
    concepts: 'Chụp ảnh profile cá nhân, cần phòng cách tối giản, lịch sự'
  };

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

  // Lấy mẫu hóa đơn đã chọn
  const getSelectedTemplate = () => {
    return INVOICE_TEMPLATES.find(template => template.id === selectedTemplate) || INVOICE_TEMPLATES[0];
  };

  // Lưu cấu hình hóa đơn
  const saveInvoiceSettings = () => {
    // Lưu cấu hình vào localStorage
    const settings = {
      selectedTemplate,
      logo,
      qrCode,
      accentColor,
      paymentInfo,
      invoiceTitle,
      customServiceData,
      bankInfo
    };

    localStorage.setItem('invoiceSettings', JSON.stringify(settings));

    // Gọi callback nếu có
    if (onSaveSettings) {
      onSaveSettings(settings);
    }

    setToast({
      message: 'Đã lưu cấu hình hóa đơn',
      type: 'success',
      isVisible: true
    });
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {INVOICE_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className={`relative cursor-pointer transition-transform duration-200 hover:scale-105 ${
                selectedTemplate === template.id ? 'ring-2 ring-[#FF5A5F]' : 'ring-1 ring-gray-200'
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded overflow-hidden">
                {/* Tạo hình ảnh mẫu thực tế thay vì sử dụng thumbnail */}
                <div className="absolute inset-0 p-1 bg-white">
                  <div className="h-full w-full overflow-hidden rounded shadow-sm" style={{ fontSize: '4px' }}>
                    <div className="p-1 flex flex-col">
                      <div className={template.style.headerStyle}>
                        <div>
                          <div className="h-2 w-6 bg-gray-200 mb-1"></div>
                          <div className={template.style.titleStyle} style={{ color: accentColor, fontSize: '6px' }}>HÓA ĐƠN DỊCH VỤ</div>
                        </div>
                        <div className="text-right">
                          <div className="h-1 w-8 bg-gray-100 mb-1"></div>
                          <div className="h-1 w-6 bg-gray-100"></div>
                        </div>
                      </div>

                      <div className="mt-1 grid grid-cols-2 gap-1">
                        <div>
                          <div className="h-1 w-6 bg-gray-100 mb-1"></div>
                          <div className="h-1 w-8 bg-gray-200"></div>
                        </div>
                        <div>
                          <div className="h-1 w-6 bg-gray-100 mb-1"></div>
                          <div className="h-1 w-8 bg-gray-200"></div>
                        </div>
                      </div>

                      <div className="mt-1">
                        <div className="w-full" style={{ borderBottom: `${template.style.borderStyle} ${accentColor}`, borderBottomWidth: '1px' }}>
                          <div className="flex justify-between py-1">
                            <div className="h-1 w-6 bg-gray-200"></div>
                            <div className="h-1 w-4 bg-gray-200"></div>
                          </div>
                        </div>
                        <div className="flex justify-between py-1">
                          <div className="h-1 w-10 bg-gray-100"></div>
                          <div className="h-1 w-6 bg-gray-100"></div>
                        </div>
                        <div className="flex justify-between py-1">
                          <div className="h-1 w-8 bg-gray-100"></div>
                          <div className="h-1 w-4 bg-gray-100"></div>
                        </div>
                        <div className="flex justify-between py-1" style={{ borderTop: '1px solid #eee' }}>
                          <div className="h-1 w-6 bg-gray-200"></div>
                          <div className="h-1 w-4 bg-gray-200"></div>
                        </div>
                        <div className="flex justify-between py-1" style={{ borderTop: `${template.style.borderStyle} ${accentColor}`, borderTopWidth: '1px' }}>
                          <div className="h-1 w-6 bg-gray-200"></div>
                          <div className="h-1 w-6 bg-gray-200" style={{ backgroundColor: accentColor }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

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

      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Thông tin cơ bản</h4>
        <div className="space-y-4">
          <div>
            <label htmlFor="invoiceTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề hóa đơn
            </label>
            <input
              type="text"
              id="invoiceTitle"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
              placeholder="Nhập tiêu đề hóa đơn"
              value={invoiceTitle}
              onChange={(e) => setInvoiceTitle(e.target.value)}
            />
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
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Dịch vụ chính</h5>
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
            </div>

            <div className="bg-white p-3 rounded-md border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-sm font-medium text-gray-700">Dịch vụ bổ sung</h5>
                <button
                  type="button"
                  onClick={handleAddAdditionalService}
                  className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm dịch vụ bổ sung
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-3">
                Các dịch vụ bổ sung sẽ được hiển thị trong hóa đơn và tính vào tổng tiền.
              </p>

              {customServiceData.additionalServices.length > 0 ? (
                <div className="space-y-2">
                  {customServiceData.additionalServices.map((service, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-gray-700 text-xs font-medium">
                        {index + 1}
                      </div>
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
                        title="Xóa dịch vụ này"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 border border-dashed border-gray-300 rounded-md">
                  <p className="text-sm text-gray-500">Chưa có dịch vụ bổ sung nào</p>
                  <button
                    type="button"
                    onClick={handleAddAdditionalService}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    + Thêm dịch vụ bổ sung
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-100 rounded-md">
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
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Xem trước hóa đơn</h3>
          <button
            onClick={saveInvoiceSettings}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Lưu cấu hình
          </button>
        </div>
        <div className="aspect-w-16 aspect-h-9 bg-white rounded shadow-sm overflow-hidden">
          <div className="p-4 flex flex-col">
            {/* Header - Thay đổi theo mẫu */}
            <div className={getSelectedTemplate().style.headerStyle}>
              <div>
                {logo && <img src={logo} alt="Logo" className="h-12 object-contain mb-2" />}
                <h2 className={getSelectedTemplate().style.titleStyle} style={{ color: accentColor }}>{invoiceTitle}</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Ngày: {sampleBookingData.date}</p>
                <p className="text-sm text-gray-500">Mã: {invoiceConfig.invoicePrefix}{Math.floor(Math.random() * 10000)}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Khách hàng:</p>
                <p className="font-medium">{sampleBookingData.customer}</p>
                <p>{sampleBookingData.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Chi tiết:</p>
                <p>Ngày chụp: {sampleBookingData.date}</p>
                <p>Thời gian: {sampleBookingData.time} ({sampleBookingData.duration} giờ)</p>
              </div>
            </div>

            <div className="mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `${getSelectedTemplate().style.borderStyle} ${accentColor}` }}>
                    <th className={getSelectedTemplate().style.tableHeaderStyle}>Dịch vụ</th>
                    <th className={`${getSelectedTemplate().style.tableHeaderStyle} text-right`}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={getSelectedTemplate().style.tableRowStyle}>
                    <td className="py-2">{customServiceData.serviceName}</td>
                    <td className="text-right py-2">{customServiceData.servicePrice.toLocaleString('vi-VN')}đ</td>
                  </tr>
                  {/* Hiển thị các dịch vụ bổ sung */}
                  {customServiceData.additionalServices.map((service, index) => (
                    <tr key={index} className={getSelectedTemplate().style.tableRowStyle}>
                      <td className="py-2">{service.name || 'Dịch vụ bổ sung'}</td>
                      <td className="text-right py-2">{service.price.toLocaleString('vi-VN')}đ</td>
                    </tr>
                  ))}
                  {sampleBookingData.concepts && (
                    <tr className={getSelectedTemplate().style.tableRowStyle}>
                      <td className="py-2">Concept: {sampleBookingData.concepts}</td>
                      <td className="text-right py-2">-</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '1px solid #eee' }}>
                    <th className="text-left py-2">Tổng cộng</th>
                    <td className="text-right py-2">{calculateTotal().toLocaleString('vi-VN')}đ</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #eee' }}>
                    <th className="text-left py-2">Đã đặt cọc</th>
                    <td className="text-right py-2">{sampleBookingData.deposit.toLocaleString('vi-VN')}đ</td>
                  </tr>
                  <tr style={{ borderTop: `${getSelectedTemplate().style.borderStyle} ${accentColor}` }}>
                    <th className="text-left py-2">Còn lại</th>
                    <td className="text-right py-2 font-bold" style={{ color: accentColor }}>
                      {(calculateTotal() - sampleBookingData.deposit).toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Hiển thị thông tin thanh toán và mã QR nếu có */}
              {(paymentInfo || qrCode) && (
                <div className={getSelectedTemplate().style.footerStyle}>
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


    </div>
  );
}
