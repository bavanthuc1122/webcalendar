'use client';

import { useState, useEffect, useRef } from 'react';
import Toast from './Toast';
import InvoicePreview from './InvoicePreview';
import { useBookings } from '../lib/hooks/useBookings';
import { useInvoices } from '../lib/hooks/useInvoices';
import { useQuery } from 'react-query';

interface SessionCompletionFormProps {
  bookingData: {
    id?: string;
    _id?: string;
    customer: string;
    phone: string;
    date: string;
    time: string;
    duration: number;
    deposit: number;
    total: number;
    concepts?: string;
    status: string;
    customerId?: string;
  };
  pdfUrl?: string;
  onSuccess?: () => void;
}

export default function SessionCompletionForm({ bookingData, pdfUrl, onSuccess }: SessionCompletionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [notes, setNotes] = useState('');
  const [sendInvoice, setSendInvoice] = useState(true);
  const [sendToAdmin, setSendToAdmin] = useState(true);
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [showCustomizeService, setShowCustomizeService] = useState(false);
  const { updateBooking } = useBookings();
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
      return savedConfig ? JSON.parse(savedConfig) : {
        companyName: '',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        companyWebsite: '',
        companyLogo: '',
        vatRate: 10,
        invoicePrefix: 'INV-',
        invoiceFooter: 'Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!'
      };
    }
  });

  const [invoiceConfig, setInvoiceConfig] = useState(() => {
    // Lấy cấu hình hóa đơn từ localStorage nếu có
    const savedConfig = localStorage.getItem('invoiceConfig');
    return savedConfig ? JSON.parse(savedConfig) : {
      companyName: '',
      companyAddress: '',
      companyPhone: '',
      companyEmail: '',
      companyWebsite: '',
      companyLogo: '',
      vatRate: 10,
      invoicePrefix: 'INV-',
      invoiceFooter: 'Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!'
    };
  });

  // Cập nhật state khi có dữ liệu từ API
  useEffect(() => {
    if (invoiceConfigData) {
      setInvoiceConfig(invoiceConfigData);
    }
  }, [invoiceConfigData]);

  const [invoiceSettings, setInvoiceSettings] = useState<any>(null);
  const [customServiceData, setCustomServiceData] = useState({
    serviceName: `Dịch vụ chụp ảnh (${bookingData.duration} giờ)`,
    servicePrice: bookingData.total,
    additionalServices: [] as { name: string; price: number }[]
  });
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Lấy email admin từ API
  const { data: adminEmailData } = useQuery(['adminEmail'], async () => {
    try {
      const response = await fetch('/api/settings?type=adminEmail');
      if (!response.ok) {
        throw new Error('Lỗi khi lấy email admin');
      }
      return response.json();
    } catch (error) {
      console.error('Lỗi khi lấy email admin:', error);
      // Fallback to localStorage if API fails
      return localStorage.getItem('adminEmail') || '';
    }
  });

  const [adminEmail, setAdminEmail] = useState(() => {
    // Lấy email admin từ localStorage nếu có
    const savedEmail = localStorage.getItem('adminEmail');
    return savedEmail || '';
  });

  // Cập nhật state khi có dữ liệu từ API
  useEffect(() => {
    if (adminEmailData) {
      setAdminEmail(adminEmailData);
    }
  }, [adminEmailData]);

  // Lấy cấu hình email từ API
  const { data: emailConfigData } = useQuery(['emailConfig'], async () => {
    try {
      const response = await fetch('/api/settings?type=email');
      if (!response.ok) {
        throw new Error('Lỗi khi lấy cấu hình email');
      }
      return response.json();
    } catch (error) {
      console.error('Lỗi khi lấy cấu hình email:', error);
      // Fallback to localStorage if API fails
      const savedConfig = localStorage.getItem('emailConfig');
      return savedConfig ? JSON.parse(savedConfig) : {
        host: '',
        port: '587',
        user: '',
        pass: ''
      };
    }
  });

  const [emailConfig, setEmailConfig] = useState(() => {
    // Lấy cấu hình email từ localStorage nếu có
    const savedConfig = localStorage.getItem('emailConfig');
    return savedConfig ? JSON.parse(savedConfig) : {
      host: '',
      port: '587',
      user: '',
      pass: ''
    };
  });

  // Cập nhật state khi có dữ liệu từ API
  useEffect(() => {
    if (emailConfigData) {
      setEmailConfig(emailConfigData);
    }
  }, [emailConfigData]);
  const [toast, setToast] = useState({
    message: '',
    type: 'success' as 'success' | 'error',
    isVisible: false
  });

  // Tải cấu hình hóa đơn đã lưu
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

  // Cập nhật state khi có dữ liệu từ API
  useEffect(() => {
    if (invoiceSettingsData) {
      setInvoiceSettings(invoiceSettingsData);
    } else {
      // Fallback to localStorage
      const savedSettings = localStorage.getItem('invoiceSettings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setInvoiceSettings(settings);
        } catch (error) {
          console.error('Lỗi khi tải cấu hình hóa đơn từ localStorage:', error);
        }
      }
    }
  }, [invoiceSettingsData]);

  // Đảm bảo giá dịch vụ chính đồng nhất từ khâu nhập lịch
  useEffect(() => {
    setCustomServiceData(prev => ({
      ...prev,
      serviceName: `Dịch vụ chụp ảnh (${bookingData.duration} giờ)`,
      servicePrice: bookingData.total
    }));
  }, [bookingData.duration, bookingData.total]);

  // Hàm xử lý thêm dịch vụ bổ sung
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

  // Xử lý tải lên logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newSettings = {...(invoiceSettings || {}), logo: event.target?.result as string};
        setInvoiceSettings(newSettings);
      };
      reader.readAsDataURL(file);
    }
  };

  // Lưu email admin vào API khi thay đổi
  const handleAdminEmailChange = async (email: string) => {
    setAdminEmail(email);

    try {
      // Lưu vào API
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'adminEmail',
          data: email,
        }),
      });

      if (!response.ok) {
        throw new Error('Lỗi khi lưu email admin');
      }

      // Fallback to localStorage
      localStorage.setItem('adminEmail', email);
    } catch (error) {
      console.error('Lỗi khi lưu email admin:', error);
      // Fallback to localStorage
      localStorage.setItem('adminEmail', email);
    }
  };

  const handleCompleteSession = async () => {
    setIsLoading(true);
    try {
      // Cập nhật trạng thái của booking thành 'completed'
      const updatedBooking = {
        ...bookingData,
        status: 'completed',
        completionNotes: notes,
        completedAt: new Date().toISOString(),
        total: calculateTotal(), // Sử dụng tổng tiền mới từ dịch vụ chính và dịch vụ bổ sung
        additionalServices: customServiceData.additionalServices
      };

      // Cập nhật booking trong MongoDB
      const bookingId = bookingData._id || bookingData.id;
      if (!bookingId) {
        throw new Error('Không tìm thấy ID của booking');
      }

      // Gọi API để cập nhật booking
      await updateBooking(updatedBooking);

      // Tạo hóa đơn mới nếu chưa có
      if (pdfUrl) {
        try {
          // Tạo số hóa đơn mới
          const invoiceNumber = await generateInvoiceNumber(invoiceConfig.invoicePrefix || 'INV-');

          // Tạo hóa đơn mới
          await createInvoice({
            invoiceNumber,
            bookingId: bookingId,
            customerId: bookingData.customerId || '',
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
            notes: notes
          });
        } catch (invoiceError) {
          console.error('Lỗi khi tạo hóa đơn:', invoiceError);
          // Tiếp tục xử lý ngay cả khi có lỗi khi tạo hóa đơn
        }
      }

      // Nếu có pdfUrl và người dùng chọn gửi hóa đơn
      if (pdfUrl && sendInvoice) {
        // Gửi hóa đơn qua Zalo
        await fetch('/api/send-via-zalo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: bookingData.phone,
            message: `Cảm ơn ${bookingData.customer} đã sử dụng dịch vụ của chúng tôi. Đính kèm là hóa đơn cho buổi chụp ảnh của bạn.`,
            pdfUrl,
          }),
        });
      }

      // Nếu người dùng chọn gửi cho admin
      if (sendToAdmin && adminEmail) {
        // Lấy cấu hình email đã lưu
        const savedEmailConfig = localStorage.getItem('emailConfig');
        const emailConfigToUse = savedEmailConfig ? JSON.parse(savedEmailConfig) : emailConfig;

        // Gửi email cho admin
        await fetch('/api/send-to-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: adminEmail,
            subject: `Buổi chụp đã hoàn thành: ${bookingData.customer} - ${bookingData.date}`,
            message: `
              Buổi chụp với ${bookingData.customer} đã hoàn thành.

              Thông tin buổi chụp:
              - Ngày: ${bookingData.date}
              - Giờ: ${bookingData.time}
              - Thời lượng: ${bookingData.duration} giờ
              - Dịch vụ chính: ${customServiceData.serviceName} - ${customServiceData.servicePrice.toLocaleString('vi-VN')}đ
              ${customServiceData.additionalServices.map(service => `- ${service.name}: ${service.price.toLocaleString('vi-VN')}đ`).join('\n')}
              - Tổng chi phí: ${calculateTotal().toLocaleString('vi-VN')}đ
              - Đặt cọc: ${bookingData.deposit.toLocaleString('vi-VN')}đ
              - Còn lại: ${(calculateTotal() - bookingData.deposit).toLocaleString('vi-VN')}đ

              Ghi chú: ${notes || 'Không có'}
            `,
            pdfUrl,
            config: emailConfigToUse
          }),
        }).then(response => {
          if (!response.ok) {
            throw new Error('Không thể gửi email cho admin');
          }
          return response.json();
        }).then(data => {
          console.log('Email đã được gửi:', data);
        }).catch(error => {
          console.error('Lỗi khi gửi email:', error);
          setToast({
            message: 'Có lỗi xảy ra khi gửi email cho admin',
            type: 'error',
            isVisible: true
          });
        });
      }

      setToast({
        message: 'Đã xác nhận hoàn thành buổi chụp!',
        type: 'success',
        isVisible: true
      });

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error) {
      console.error('Lỗi khi hoàn thành buổi chụp:', error);
      setToast({
        message: 'Có lỗi xảy ra khi hoàn thành buổi chụp',
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

  return (
    <div className="space-y-4">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Xác nhận hoàn thành buổi chụp</h3>
          <div className="flex space-x-2">
            {pdfUrl && (
              <button
                onClick={() => window.open(pdfUrl, '_blank')}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Xem hóa đơn
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Cột bên trái - Tùy chỉnh */}
          <div className="space-y-4">
            {/* Chọn mẫu hóa đơn */}
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Chọn mẫu hóa đơn</h5>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[
                  { id: 1, name: 'Cơ bản', style: 'bg-white border' },
                  { id: 2, name: 'Hiện đại', style: 'bg-gray-50' },
                  { id: 3, name: 'Sang trọng', style: 'bg-white border-b-2' },
                  { id: 4, name: 'Tối giản', style: 'bg-white' },
                  { id: 5, name: 'Sáng tạo', style: 'bg-white border-dashed' },
                  { id: 6, name: 'Chuyên nghiệp', style: 'bg-gray-800 text-white' }
                ].map((template) => (
                  <div
                    key={template.id}
                    className={`cursor-pointer p-2 rounded transition-all ${
                      (invoiceSettings?.selectedTemplate || 1) === template.id
                        ? 'ring-2 ring-[#FF5A5F]'
                        : 'ring-1 ring-gray-200 hover:ring-gray-300'
                    }`}
                    onClick={() => {
                      const newSettings = {...(invoiceSettings || {}), selectedTemplate: template.id};
                      setInvoiceSettings(newSettings);
                    }}
                  >
                    <div className={`rounded p-1.5 ${template.style}`}>
                      <div className="flex justify-between items-center">
                        <div className="h-2 w-8 bg-gray-200"></div>
                        <div className="h-2 w-4 bg-gray-200"></div>
                      </div>
                      <div className="h-2 w-16 bg-gray-300 mt-1.5" style={{ backgroundColor: template.id === (invoiceSettings?.selectedTemplate || 1) ? (invoiceSettings?.accentColor || '#FF5A5F') : '' }}></div>
                      <div className="flex justify-between mt-2">
                        <div className="h-1.5 w-6 bg-gray-200"></div>
                        <div className="h-1.5 w-4 bg-gray-200"></div>
                      </div>
                    </div>
                    <div className="text-xs font-medium mt-1 text-center">{template.name}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Chọn mẫu phù hợp với thương hiệu của bạn</span>
                <button
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    // Mở modal chọn mẫu đầy đủ nếu cần
                  }}
                >
                  Xem tất cả
                </button>
              </div>
            </div>

            {/* Tùy chỉnh dịch vụ */}
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-sm font-medium text-gray-700">Dịch vụ chính</h5>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="col-span-2">
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] text-sm"
                    placeholder="Tên dịch vụ"
                    value={customServiceData.serviceName}
                    onChange={(e) => setCustomServiceData({...customServiceData, serviceName: e.target.value})}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] text-sm"
                    placeholder="Giá"
                    value={customServiceData.servicePrice.toLocaleString('vi-VN')}
                    onChange={(e) => {
                      const price = e.target.value ? parseInt(e.target.value.replace(/\D/g, '')) : 0;
                      setCustomServiceData({...customServiceData, servicePrice: price});
                    }}
                  />
                </div>
              </div>

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
                  Thêm
                </button>
              </div>

              {customServiceData.additionalServices.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {customServiceData.additionalServices.map((service, index) => (
                    <div key={index} className="flex items-center space-x-1">
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-gray-200 rounded-full text-gray-700 text-xs font-medium">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        className="flex-1 p-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5A5F] text-sm"
                        placeholder="Tên dịch vụ bổ sung"
                        value={service.name}
                        onChange={(e) => handleUpdateAdditionalService(index, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        className="w-24 p-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5A5F] text-sm"
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 border border-dashed border-gray-300 rounded-md">
                  <button
                    type="button"
                    onClick={handleAddAdditionalService}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    + Thêm dịch vụ bổ sung
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
                <span className="text-sm font-medium">Tổng cộng:</span>
                <span className="text-base font-bold text-[#FF5A5F]">{calculateTotal().toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            {/* Tải lên logo */}
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Logo công ty</h5>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF5A5F] transition-colors"
                onClick={() => logoInputRef.current?.click()}
              >
                {invoiceSettings?.logo ? (
                  <div className="relative w-full h-20">
                    <img
                      src={invoiceSettings.logo}
                      alt="Logo"
                      className="object-contain w-full h-full"
                    />
                    <button
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSettings = {...(invoiceSettings || {}), logo: null};
                        setInvoiceSettings(newSettings);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-1 text-xs text-gray-500">Nhấp để tải lên logo (PNG, JPG)</p>
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

            {/* Tùy chọn màu sắc */}
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Màu chủ đạo</h5>
              <div className="flex flex-wrap gap-2">
                {['#FF5A5F', '#00A699', '#FC642D', '#484848', '#767676', '#3B5998', '#1DA1F2'].map((color) => (
                  <div
                    key={color}
                    className={`w-6 h-6 rounded-full cursor-pointer ${
                      (invoiceSettings?.accentColor || '#FF5A5F') === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      const newSettings = {...(invoiceSettings || {}), accentColor: color};
                      setInvoiceSettings(newSettings);
                    }}
                  />
                ))}
                <div className="flex items-center">
                  <input
                    type="color"
                    value={invoiceSettings?.accentColor || '#FF5A5F'}
                    onChange={(e) => {
                      const newSettings = {...(invoiceSettings || {}), accentColor: e.target.value};
                      setInvoiceSettings(newSettings);
                    }}
                    className="w-6 h-6 rounded-full cursor-pointer border-0 p-0 m-0"
                  />
                </div>
              </div>
            </div>

            {/* Tùy chọn gửi hóa đơn */}
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Tùy chọn gửi hóa đơn</h5>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendInvoice"
                    checked={sendInvoice}
                    onChange={(e) => setSendInvoice(e.target.checked)}
                    className="h-4 w-4 text-[#FF5A5F] focus:ring-[#FF5A5F] border-gray-300 rounded"
                  />
                  <label htmlFor="sendInvoice" className="ml-2 block text-sm text-gray-700">
                    Gửi hóa đơn cho khách hàng qua Zalo
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendToAdmin"
                    checked={sendToAdmin}
                    onChange={(e) => setSendToAdmin(e.target.checked)}
                    className="h-4 w-4 text-[#FF5A5F] focus:ring-[#FF5A5F] border-gray-300 rounded"
                  />
                  <label htmlFor="sendToAdmin" className="ml-2 block text-sm text-gray-700">
                    Gửi thông báo và hóa đơn cho admin
                  </label>
                </div>

                {sendToAdmin && (
                  <div className="pl-6 mt-2">
                    <input
                      type="email"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] text-sm"
                      placeholder="Nhập email admin"
                      value={adminEmail}
                      onChange={(e) => handleAdminEmailChange(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cột bên phải - Xem trước hóa đơn */}
          <div className="bg-white p-3 rounded-md border border-gray-200">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Xem trước hóa đơn</h5>
            <div className="aspect-w-16 aspect-h-9 bg-white rounded shadow-sm overflow-hidden border border-gray-200">
              <div className="p-4 flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    {invoiceSettings?.logo && <img src={invoiceSettings.logo} alt="Logo" className="h-10 object-contain mb-2" />}
                    <h2 className="text-lg font-bold" style={{ color: invoiceSettings?.accentColor || '#FF5A5F' }}>
                      {invoiceSettings?.invoiceTitle || 'HÓA ĐƠN DỊCH VỤ'}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Ngày: {bookingData.date}</p>
                    <p className="text-sm text-gray-500">Mã: {invoiceConfig.invoicePrefix}{Math.floor(Math.random() * 10000)}</p>
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
                      <tr style={{ borderBottom: `2px solid ${invoiceSettings?.accentColor || '#FF5A5F'}` }}>
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
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: '1px solid #eee' }}>
                        <th className="text-left py-2">Tổng cộng</th>
                        <td className="text-right py-2">{calculateTotal().toLocaleString('vi-VN')}đ</td>
                      </tr>
                      <tr style={{ borderTop: '1px solid #eee' }}>
                        <th className="text-left py-2">Đã đặt cọc</th>
                        <td className="text-right py-2">{bookingData.deposit.toLocaleString('vi-VN')}đ</td>
                      </tr>
                      <tr style={{ borderTop: `2px solid ${invoiceSettings?.accentColor || '#FF5A5F'}` }}>
                        <th className="text-left py-2">Còn lại</th>
                        <td className="text-right py-2 font-bold" style={{ color: invoiceSettings?.accentColor || '#FF5A5F' }}>
                          {(calculateTotal() - bookingData.deposit).toLocaleString('vi-VN')}đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Hiển thị thông tin thanh toán và mã QR nếu có */}
                  {(invoiceSettings?.paymentInfo || invoiceSettings?.qrCode) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-col md:flex-row">
                        {invoiceSettings?.paymentInfo && (
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700 mb-1">Thông tin thanh toán:</p>
                            <p className="text-sm whitespace-pre-line">{invoiceSettings.paymentInfo}</p>
                          </div>
                        )}
                        {invoiceSettings?.qrCode && (
                          <div className="mt-3 md:mt-0 md:ml-4 flex-shrink-0">
                            <img src={invoiceSettings.qrCode} alt="QR thanh toán" className="h-28 object-contain" />
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



        <div className="mt-6 flex justify-end">
          <button
            onClick={handleCompleteSession}
            disabled={isLoading || (sendToAdmin && !adminEmail)}
            className={`py-2 px-6 rounded-lg flex items-center ${
              isLoading || (sendToAdmin && !adminEmail)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            } transition-all duration-200`}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Xác nhận hoàn thành
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
