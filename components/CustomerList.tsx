'use client';

import { useState, useEffect } from 'react';
import Toast from './Toast';
import InvoicePreview from './InvoicePreview';

interface Customer {
  id: string;
  customer: string;
  phone: string;
  date: string;
  time: string;
  duration: number;
  deposit: number;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  invoiceUrl?: string;
  completedAt?: string;
}

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configTab, setConfigTab] = useState<'googleSheet' | 'invoice' | 'email'>('googleSheet');
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [googleSheetConfig, setGoogleSheetConfig] = useState(() => {
    // Lấy cấu hình Google Sheet từ localStorage nếu có
    const savedConfig = localStorage.getItem('googleSheetConfig');
    return savedConfig ? JSON.parse(savedConfig) : {
      apiKey: '',
      sheetId: '',
      sheetName: 'Customers'
    };
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
  const [emailConfig, setEmailConfig] = useState(() => {
    // Lấy cấu hình email từ localStorage nếu có
    const savedConfig = localStorage.getItem('emailConfig');
    return savedConfig ? JSON.parse(savedConfig) : {
      host: 'smtp.gmail.com',
      port: '587',
      user: '',
      pass: ''
    };
  });
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [toast, setToast] = useState({
    message: '',
    type: 'success' as 'success' | 'error',
    isVisible: false
  });

  // Lấy danh sách khách hàng từ localStorage
  useEffect(() => {
    const bookingsJSON = localStorage.getItem('bookings') || '[]';
    const bookings = JSON.parse(bookingsJSON);
    setCustomers(bookings);
    setFilteredCustomers(bookings);
  }, []);

  // Lọc khách hàng khi searchTerm hoặc statusFilter thay đổi
  useEffect(() => {
    let filtered = customers;

    // Lọc theo trạng thái
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.customer.toLowerCase().includes(term) ||
        customer.phone.includes(term) ||
        customer.date.includes(term)
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, statusFilter]);

  // Lưu cấu hình Google Sheet
  const handleSaveGoogleSheetConfig = () => {
    localStorage.setItem('googleSheetConfig', JSON.stringify(googleSheetConfig));
    setToast({
      message: 'Đã lưu cấu hình Google Sheet thành công!',
      type: 'success',
      isVisible: true
    });
    setShowConfig(false);
  };

  // Lưu cấu hình hóa đơn
  const handleSaveInvoiceConfig = () => {
    localStorage.setItem('invoiceConfig', JSON.stringify(invoiceConfig));
    setToast({
      message: 'Đã lưu cấu hình hóa đơn thành công!',
      type: 'success',
      isVisible: true
    });
    setShowConfig(false);
  };

  // Lưu cấu hình email
  const handleSaveEmailConfig = () => {
    localStorage.setItem('emailConfig', JSON.stringify(emailConfig));
    setToast({
      message: 'Đã lưu cấu hình email thành công!',
      type: 'success',
      isVisible: true
    });
    setShowConfig(false);
  };

  // Kiểm tra email
  const handleTestEmail = async () => {
    if (!emailConfig.user) {
      setToast({
        message: 'Vui lòng nhập email người gửi',
        type: 'error',
        isVisible: true
      });
      return;
    }

    setIsTestingEmail(true);
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailConfig.user,
          config: emailConfig
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể gửi email kiểm tra');
      }

      setToast({
        message: 'Đã gửi email kiểm tra thành công!',
        type: 'success',
        isVisible: true
      });
    } catch (error) {
      console.error('Lỗi khi gửi email kiểm tra:', error);
      setToast({
        message: 'Có lỗi xảy ra khi gửi email kiểm tra',
        type: 'error',
        isVisible: true
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  // Xuất dữ liệu ra Excel
  const handleExportExcel = () => {
    setIsExporting(true);

    try {
      // Tạo dữ liệu cho Excel với BOM để hỗ trợ tiếng Việt
      const BOM = '\uFEFF'; // Byte Order Mark để hỗ trợ Unicode

      const headers = [
        'Khách hàng',
        'Số điện thoại',
        'Ngày chụp',
        'Giờ chụp',
        'Thời lượng',
        'Đặt cọc',
        'Tổng chi phí',
        'Trạng thái',
        'Ngày tạo',
        'Ngày cập nhật',
        'Ngày hoàn thành'
      ];

      const data = filteredCustomers.map(customer => [
        `"${customer.customer}"`, // Thêm dấu ngoặc kép để tránh lỗi với dấu phẩy
        `"${customer.phone}"`,
        `"${customer.date}"`,
        `"${customer.time}"`,
        `"${customer.duration} giờ"`,
        customer.deposit,
        customer.total,
        `"${translateStatus(customer.status)}"`,
        `"${formatDateForExcel(customer.createdAt)}"`,
        `"${formatDateForExcel(customer.updatedAt)}"`,
        customer.completedAt ? `"${formatDateForExcel(customer.completedAt)}"` : ''
      ]);

      // Tạo CSV với BOM
      const csvContent = BOM + [
        headers.join(','),
        ...data.map(row => row.join(','))
      ].join('\n');

      // Tạo Blob và tải xuống
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `khach-hang-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToast({
        message: 'Đã xuất dữ liệu thành công!',
        type: 'success',
        isVisible: true
      });
    } catch (error) {
      console.error('Lỗi khi xuất dữ liệu:', error);
      setToast({
        message: 'Có lỗi xảy ra khi xuất dữ liệu',
        type: 'error',
        isVisible: true
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Xuất dữ liệu lên Google Sheet
  const handleExportGoogleSheet = async () => {
    if (!googleSheetConfig.apiKey || !googleSheetConfig.sheetId) {
      setToast({
        message: 'Vui lòng cấu hình Google Sheet trước',
        type: 'error',
        isVisible: true
      });
      setShowConfig(true);
      setConfigTab('googleSheet');
      return;
    }

    setIsExporting(true);

    try {
      // Trong môi trường thực tế, bạn sẽ gọi API để xuất dữ liệu lên Google Sheet
      // Đây là một giả lập để demo
      await new Promise(resolve => setTimeout(resolve, 1500));

      setToast({
        message: 'Đã xuất dữ liệu lên Google Sheet thành công!',
        type: 'success',
        isVisible: true
      });
    } catch (error) {
      console.error('Lỗi khi xuất dữ liệu lên Google Sheet:', error);
      setToast({
        message: 'Có lỗi xảy ra khi xuất dữ liệu lên Google Sheet',
        type: 'error',
        isVisible: true
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Xử lý khi nhấp vào nút "Xử lý thanh toán"
  const handleProcessPayment = (customer: Customer) => {
    // Chuyển đến trang xử lý thanh toán
    window.location.href = `/payment?id=${customer.id}`;
  };

  // Định dạng ngày tháng
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr; // Trả về chuỗi gốc nếu không phải ngày hợp lệ

      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateStr; // Trả về chuỗi gốc nếu có lỗi
    }
  };

  // Định dạng ngày tháng cho Excel
  const formatDateForExcel = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr; // Trả về chuỗi gốc nếu không phải ngày hợp lệ

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return dateStr; // Trả về chuỗi gốc nếu có lỗi
    }
  };

  // Dịch trạng thái
  const translateStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'completed':
        return 'Đã hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  // Lấy màu cho trạng thái
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Hàm chuyển đổi tên ngân hàng thành mã ngân hàng cho VietQR
  const getBankCode = (bankName: string): string | null => {
    const bankName_lower = bankName.toLowerCase();

    // Danh sách mã ngân hàng phổ biến
    const bankCodes: { [key: string]: string } = {
      'vcb': 'VCB',
      'vietcombank': 'VCB',
      'techcombank': 'TCB',
      'tcb': 'TCB',
      'vietinbank': 'ICB',
      'mbbank': 'MB',
      'mb': 'MB',
      'acb': 'ACB',
      'tpbank': 'TPB',
      'vpbank': 'VPB',
      'sacombank': 'STB',
      'bidv': 'BIDV',
      'agribank': 'AGRIBANK',
      'hdbank': 'HDB',
      'ocb': 'OCB',
      'scb': 'SCB',
      'vib': 'VIB',
      'eximbank': 'EIB',
      'msb': 'MSB',
      'seabank': 'SEAB',
      'abbank': 'ABB',
      'vietabank': 'VAB',
      'namabank': 'NAB',
      'shb': 'SHB',
      'baovietbank': 'BVB',
      'gpbank': 'GPB',
      'oceanbank': 'OJB',
      'ncb': 'NCB',
      'kienlongbank': 'KLB',
      'dongabank': 'DAB',
      'bac a bank': 'BAB',
      'bacabank': 'BAB',
      'lien viet post bank': 'LPB',
      'lienvietpostbank': 'LPB',
      'pvcombank': 'PVCB',
      'vietbank': 'VBB',
      'cake': 'CAKE',
      'ubank': 'UBANK',
      'timo': 'TIMO'
    };

    // Tìm mã ngân hàng phù hợp
    for (const [key, code] of Object.entries(bankCodes)) {
      if (bankName_lower.includes(key)) {
        return code;
      }
    }

    return null;
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

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <a
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Quay lại Dashboard</span>
            </a>
            <h2 className="text-xl font-semibold">Quản lý khách hàng</h2>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleExportExcel}
              disabled={isExporting || filteredCustomers.length === 0}
              className={`py-2 px-3 rounded-lg flex items-center text-sm ${
                isExporting || filteredCustomers.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isExporting ? (
                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              Xuất Excel
            </button>
            <button
              onClick={handleExportGoogleSheet}
              disabled={isExporting || filteredCustomers.length === 0}
              className={`py-2 px-3 rounded-lg flex items-center text-sm ${
                isExporting || filteredCustomers.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isExporting ? (
                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              Google Sheet
            </button>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="py-2 px-3 rounded-lg flex items-center text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Cấu hình
            </button>
          </div>
        </div>

        {showConfig && (
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <div className="flex border-b border-gray-200 mb-4">
              <button
                className={`py-2 px-4 font-medium text-sm ${
                  configTab === 'googleSheet'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setConfigTab('googleSheet')}
              >
                Cấu hình Google Sheet
              </button>
              <button
                className={`py-2 px-4 font-medium text-sm ${
                  configTab === 'invoice'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setConfigTab('invoice')}
              >
                Cấu hình Hóa đơn
              </button>
              <button
                className={`py-2 px-4 font-medium text-sm ${
                  configTab === 'email'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setConfigTab('email')}
              >
                Cấu hình Email
              </button>
            </div>

            {configTab === 'googleSheet' && (
              <div className="space-y-3">
                <h3 className="text-md font-medium mb-3">Cấu hình Google Sheet</h3>
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="text"
                    id="apiKey"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập Google API Key"
                    value={googleSheetConfig.apiKey}
                    onChange={(e) => setGoogleSheetConfig({...googleSheetConfig, apiKey: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="sheetId" className="block text-sm font-medium text-gray-700 mb-1">
                    Sheet ID
                  </label>
                  <input
                    type="text"
                    id="sheetId"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập ID của Google Sheet"
                    value={googleSheetConfig.sheetId}
                    onChange={(e) => setGoogleSheetConfig({...googleSheetConfig, sheetId: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ID của Google Sheet nằm trong URL: https://docs.google.com/spreadsheets/d/<span className="font-medium">SHEET_ID</span>/edit
                  </p>
                </div>
                <div>
                  <label htmlFor="sheetName" className="block text-sm font-medium text-gray-700 mb-1">
                    Tên Sheet
                  </label>
                  <input
                    type="text"
                    id="sheetName"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên của sheet (mặc định: Customers)"
                    value={googleSheetConfig.sheetName}
                    onChange={(e) => setGoogleSheetConfig({...googleSheetConfig, sheetName: e.target.value})}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveGoogleSheetConfig}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200"
                  >
                    Lưu cấu hình
                  </button>
                </div>
              </div>
            )}

            {configTab === 'invoice' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-md font-medium">Cấu hình Hóa đơn</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                              (invoiceConfig.selectedTemplate || 1) === template.id
                                ? 'ring-2 ring-[#FF5A5F]'
                                : 'ring-1 ring-gray-200 hover:ring-gray-300'
                            }`}
                            onClick={() => {
                              setInvoiceConfig({...invoiceConfig, selectedTemplate: template.id});
                            }}
                          >
                            <div className={`rounded p-1.5 ${template.style}`}>
                              <div className="flex justify-between items-center">
                                <div className="h-2 w-8 bg-gray-200"></div>
                                <div className="h-2 w-4 bg-gray-200"></div>
                              </div>
                              <div className="h-2 w-16 bg-gray-300 mt-1.5" style={{ backgroundColor: template.id === (invoiceConfig.selectedTemplate || 1) ? (invoiceConfig.accentColor || '#FF5A5F') : '' }}></div>
                              <div className="flex justify-between mt-2">
                                <div className="h-1.5 w-6 bg-gray-200"></div>
                                <div className="h-1.5 w-4 bg-gray-200"></div>
                              </div>
                            </div>
                            <div className="text-xs font-medium mt-1 text-center">{template.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tải lên logo */}
                    <div className="bg-white p-3 rounded-md border border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Logo công ty</h5>
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF5A5F] transition-colors"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        {invoiceConfig.logo ? (
                          <div className="relative w-full h-20">
                            <img
                              src={invoiceConfig.logo}
                              alt="Logo"
                              className="object-contain w-full h-full"
                            />
                            <button
                              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInvoiceConfig({...invoiceConfig, logo: null});
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
                          id="logo-upload"
                          className="hidden"
                          accept="image/png, image/jpeg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setInvoiceConfig({...invoiceConfig, logo: event.target?.result as string});
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
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
                              (invoiceConfig.accentColor || '#FF5A5F') === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              setInvoiceConfig({...invoiceConfig, accentColor: color});
                            }}
                          />
                        ))}
                        <div className="flex items-center">
                          <input
                            type="color"
                            value={invoiceConfig.accentColor || '#FF5A5F'}
                            onChange={(e) => {
                              setInvoiceConfig({...invoiceConfig, accentColor: e.target.value});
                            }}
                            className="w-6 h-6 rounded-full cursor-pointer border-0 p-0 m-0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Thông tin thanh toán */}
                    <div className="bg-white p-3 rounded-md border border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Chỉnh sửa thông tin thanh toán</h5>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">Ngân hàng</label>
                          <select
                            id="bankName"
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                            value={invoiceConfig.bankName || ''}
                            onChange={(e) => {
                              setInvoiceConfig({...invoiceConfig, bankName: e.target.value});
                            }}
                          >
                            <option value="">Chọn ngân hàng</option>
                            <option value="Vietcombank">Vietcombank</option>
                            <option value="Techcombank">Techcombank</option>
                            <option value="MB Bank">MB Bank</option>
                            <option value="ACB">ACB</option>
                            <option value="TPBank">TPBank</option>
                            <option value="VPBank">VPBank</option>
                            <option value="Sacombank">Sacombank</option>
                            <option value="BIDV">BIDV</option>
                            <option value="Agribank">Agribank</option>
                            <option value="HDBank">HDBank</option>
                            <option value="OCB">OCB</option>
                            <option value="VIB">VIB</option>
                            <option value="SeABank">SeABank</option>
                            <option value="SHB">SHB</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
                          <input
                            type="text"
                            id="accountNumber"
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                            placeholder="Nhập số tài khoản"
                            value={invoiceConfig.accountNumber || ''}
                            onChange={(e) => setInvoiceConfig({...invoiceConfig, accountNumber: e.target.value})}
                          />
                        </div>

                        <div>
                          <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">Tên chủ tài khoản</label>
                          <input
                            type="text"
                            id="accountName"
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                            placeholder="Nhập tên chủ tài khoản"
                            value={invoiceConfig.accountName || ''}
                            onChange={(e) => setInvoiceConfig({...invoiceConfig, accountName: e.target.value})}
                          />
                        </div>

                        <div>
                          <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh (không bắt buộc)</label>
                          <input
                            type="text"
                            id="branchName"
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                            placeholder="Nhập chi nhánh ngân hàng"
                            value={invoiceConfig.branchName || ''}
                            onChange={(e) => setInvoiceConfig({...invoiceConfig, branchName: e.target.value})}
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="defaultPayment"
                            checked={invoiceConfig.isDefaultPayment || false}
                            onChange={(e) => setInvoiceConfig({...invoiceConfig, isDefaultPayment: e.target.checked})}
                            className="h-4 w-4 text-[#FF5A5F] focus:ring-[#FF5A5F] border-gray-300 rounded"
                          />
                          <label htmlFor="defaultPayment" className="ml-2 block text-sm text-gray-700">
                            Đặt làm mặc định
                          </label>
                        </div>

                        <div className="flex justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              // Đóng form chỉnh sửa
                              setToast({
                                message: 'Đã hủy chỉnh sửa thông tin thanh toán',
                                type: 'success',
                                isVisible: true
                              });
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-all duration-200"
                          >
                            Hủy
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (invoiceConfig.bankName && invoiceConfig.accountNumber && invoiceConfig.accountName) {
                                // Tạo QR code VietQR
                                const bankCode = getBankCode(invoiceConfig.bankName);
                                if (bankCode) {
                                  const qrUrl = `https://img.vietqr.io/image/${bankCode}-${invoiceConfig.accountNumber}-compact.png?addInfo=Thanh%20toan%20dich%20vu%20chup%20anh`;
                                  setInvoiceConfig({...invoiceConfig, qrCode: qrUrl});
                                  setToast({
                                    message: 'Đã lưu thông tin thanh toán thành công!',
                                    type: 'success',
                                    isVisible: true
                                  });
                                } else {
                                  setToast({
                                    message: 'Không tìm thấy mã ngân hàng. Vui lòng kiểm tra lại tên ngân hàng.',
                                    type: 'error',
                                    isVisible: true
                                  });
                                }
                              } else {
                                setToast({
                                  message: 'Vui lòng nhập đầy đủ thông tin ngân hàng, số tài khoản và tên chủ tài khoản.',
                                  type: 'error',
                                  isVisible: true
                                });
                              }
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200"
                          >
                            Lưu
                          </button>
                        </div>

                        {invoiceConfig.qrCode && (
                          <div className="mt-4 flex flex-col items-center">
                            <p className="text-sm font-medium text-gray-700 mb-2">Mã QR thanh toán</p>
                            <img src={invoiceConfig.qrCode} alt="QR Code" className="h-40 object-contain" />
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
                            {invoiceConfig.logo && <img src={invoiceConfig.logo} alt="Logo" className="h-10 object-contain mb-2" />}
                            <h2 className="text-lg font-bold" style={{ color: invoiceConfig.accentColor || '#FF5A5F' }}>
                              {invoiceConfig.invoiceTitle || 'HÓA ĐƠN DỊCH VỤ'}
                            </h2>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Ngày: 01/06/2024</p>
                            <p className="text-sm text-gray-500">Mã: {invoiceConfig.invoicePrefix || 'INV-'}{Math.floor(Math.random() * 10000)}</p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Khách hàng:</p>
                            <p className="font-medium">Nguyễn Văn A</p>
                            <p>0987654321</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Chi tiết:</p>
                            <p>Ngày chụp: 01/06/2024</p>
                            <p>Thời gian: 10:00 (2 giờ)</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <table className="w-full text-sm">
                            <thead>
                              <tr style={{ borderBottom: `2px solid ${invoiceConfig.accentColor || '#FF5A5F'}` }}>
                                <th className="text-left py-2">Dịch vụ</th>
                                <th className="text-right py-2">Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="py-2">Dịch vụ chụp ảnh (2 giờ)</td>
                                <td className="text-right py-2">1.500.000đ</td>
                              </tr>
                              <tr>
                                <td className="py-2">Trang điểm cơ bản</td>
                                <td className="text-right py-2">500.000đ</td>
                              </tr>
                            </tbody>
                            <tfoot>
                              <tr style={{ borderTop: '1px solid #eee' }}>
                                <th className="text-left py-2">Tổng cộng</th>
                                <td className="text-right py-2">2.000.000đ</td>
                              </tr>
                              <tr style={{ borderTop: '1px solid #eee' }}>
                                <th className="text-left py-2">Đã đặt cọc</th>
                                <td className="text-right py-2">500.000đ</td>
                              </tr>
                              <tr style={{ borderTop: `2px solid ${invoiceConfig.accentColor || '#FF5A5F'}` }}>
                                <th className="text-left py-2">Còn lại</th>
                                <td className="text-right py-2 font-bold" style={{ color: invoiceConfig.accentColor || '#FF5A5F' }}>
                                  1.500.000đ
                                </td>
                              </tr>
                            </tfoot>
                          </table>

                          {/* Hiển thị thông tin thanh toán và mã QR nếu có */}
                          {(invoiceConfig.bankName || invoiceConfig.qrCode) && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex flex-col md:flex-row">
                                {invoiceConfig.bankName && (
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Thông tin thanh toán:</p>
                                    <p className="text-sm whitespace-pre-line">
                                      {invoiceConfig.bankName}<br/>
                                      Số TK: {invoiceConfig.accountNumber || '...'}<br/>
                                      Chủ TK: {invoiceConfig.accountName || '...'}
                                    </p>
                                  </div>
                                )}
                                {invoiceConfig.qrCode && (
                                  <div className="mt-3 md:mt-0 md:ml-4 flex-shrink-0">
                                    <img src={invoiceConfig.qrCode} alt="QR thanh toán" className="h-28 object-contain" />
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

                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleSaveInvoiceConfig}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200"
                  >
                    Lưu cấu hình
                  </button>
                </div>
              </div>
            )}

            {configTab === 'email' && (
              <div className="space-y-3">
                <h3 className="text-md font-medium mb-3">Cấu hình Email</h3>
                <div className="bg-gray-100 rounded-md p-3 text-xs text-gray-600 mb-3">
                  <p className="font-medium mb-1">Hướng dẫn cấu hình email:</p>
                  <p>1. Đảm bảo bạn đã cấu hình SMTP trong file .env</p>
                  <p>2. Hoặc sử dụng dịch vụ email như SendGrid, Mailgun</p>
                  <p>3. Kiểm tra email trước khi sử dụng</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      id="smtpHost"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="smtp.gmail.com"
                      value={emailConfig.host}
                      onChange={(e) => setEmailConfig({...emailConfig, host: e.target.value})}
                    />
                  </div>
                  <div>
                    <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Port
                    </label>
                    <input
                      type="text"
                      id="smtpPort"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="587"
                      value={emailConfig.port}
                      onChange={(e) => setEmailConfig({...emailConfig, port: e.target.value})}
                    />
                  </div>
                  <div>
                    <label htmlFor="smtpUser" className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP User
                    </label>
                    <input
                      type="text"
                      id="smtpUser"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your-email@gmail.com"
                      value={emailConfig.user}
                      onChange={(e) => setEmailConfig({...emailConfig, user: e.target.value})}
                    />
                  </div>
                  <div>
                    <label htmlFor="smtpPass" className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Password
                    </label>
                    <input
                      type="password"
                      id="smtpPass"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="app password"
                      value={emailConfig.pass}
                      onChange={(e) => setEmailConfig({...emailConfig, pass: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={isTestingEmail || !emailConfig.user}
                    className={`px-4 py-2 rounded-md flex items-center ${
                      isTestingEmail || !emailConfig.user
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isTestingEmail ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang kiểm tra...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Kiểm tra kết nối
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSaveEmailConfig}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200"
                  >
                    Lưu cấu hình
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-2 md:space-y-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === 'all' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === 'pending' ? 'bg-yellow-200 text-yellow-800' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
              }`}
            >
              Chờ xử lý
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === 'confirmed' ? 'bg-blue-200 text-blue-800' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              Đã xác nhận
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === 'completed' ? 'bg-green-200 text-green-800' : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              Đã hoàn thành
            </button>
          </div>

          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày & Giờ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thanh toán
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{customer.customer}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.date}</div>
                      <div className="text-sm text-gray-500">{customer.time} ({customer.duration} giờ)</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(customer.status)}`}>
                        {translateStatus(customer.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span>Đặt cọc: {customer.deposit.toLocaleString('vi-VN')}đ</span>
                        <span>Tổng: {customer.total.toLocaleString('vi-VN')}đ</span>
                        <span className="font-medium text-red-600">Còn lại: {(customer.total - customer.deposit).toLocaleString('vi-VN')}đ</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleProcessPayment(customer)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Xử lý
                        </button>
                        {customer.invoiceUrl && (
                          <a
                            href={customer.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900"
                          >
                            Hóa đơn
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Không có khách hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Hiển thị {filteredCustomers.length} khách hàng {statusFilter !== 'all' ? `(${translateStatus(statusFilter)})` : ''}
        </div>
      </div>
    </div>
  );
}
