'use client';

import { useState, useEffect } from 'react';
import BookingInput from './BookingInput';
import ParsedReviewForm from './ParsedReviewForm';
import CalendarAddButton from './CalendarAddButton';
import InvoiceMaker from './InvoiceMaker';
import SendInvoiceStatus from './SendInvoiceStatus';
import CustomerManager from './CustomerManager';
import BookingManager from './BookingManager';
import PaymentManager from './PaymentManager';
import { BookingData, CustomerData, PaymentSettings, saveBooking } from '../lib/db';

// Các bước trong quy trình
type Step = 'input' | 'review' | 'calendar' | 'invoice' | 'send';

export default function Dashboard() {
  // State cho dữ liệu và bước hiện tại
  const [parsedData, setParsedData] = useState<BookingData | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('input');
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentSettings | null>(null);
  
  // Xử lý dữ liệu đã phân tích
  const handleParsedData = (data: BookingData) => {
    // Thêm trạng thái mặc định
    const bookingData = {
      ...data,
      status: 'pending' as 'pending'
    };
    
    setParsedData(bookingData);
    setCurrentStep('review');
  };
  
  // Quay lại bước trước
  const handleBack = () => {
    if (currentStep === 'review') {
      setParsedData(null);
      setCurrentStep('input');
    } else if (currentStep === 'calendar') {
      setCurrentStep('review');
    } else if (currentStep === 'invoice') {
      setCurrentStep('calendar');
    } else if (currentStep === 'send') {
      setCurrentStep('invoice');
    }
  };
  
  // Chuyển đến bước tiếp theo
  const handleNext = (nextStep: Step) => {
    setCurrentStep(nextStep);
  };
  
  // Xử lý khi tạo PDF thành công
  const handlePdfGenerated = (pdfUrl: string) => {
    setGeneratedPdfUrl(pdfUrl);
    
    // Lưu URL vào dữ liệu đặt lịch
    if (parsedData) {
      const updatedBooking = {
        ...parsedData,
        invoiceUrl: pdfUrl
      };
      setParsedData(updatedBooking);
      
      // Lưu vào cơ sở dữ liệu
      saveBooking(updatedBooking);
    }
    
    setCurrentStep('send');
  };
  
  // Xử lý khi hoàn thành quy trình
  const handleComplete = () => {
    // Lưu trạng thái hoàn thành
    if (parsedData) {
      const completedBooking = {
        ...parsedData,
        status: 'confirmed' as 'confirmed'
      };
      saveBooking(completedBooking);
    }
    
    // Reset về bước đầu tiên
    setParsedData(null);
    setGeneratedPdfUrl(null);
    setCurrentStep('input');
  };
  
  // Xử lý khi chọn khách hàng
  const handleSelectCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer);
  };
  
  // Xử lý khi chọn thanh toán
  const handleSelectPayment = (payment: PaymentSettings) => {
    setSelectedPayment(payment);
  };
  
  // Hiển thị tiêu đề cho bước hiện tại
  const getStepTitle = () => {
    switch (currentStep) {
      case 'input':
        return 'Nhập thông tin đặt lịch';
      case 'review':
        return 'Xem lại thông tin';
      case 'calendar':
        return 'Thêm vào lịch';
      case 'invoice':
        return 'Tạo hóa đơn';
      case 'send':
        return 'Gửi hóa đơn';
      default:
        return 'Web Calendar Booking';
    }
  };
  
  // Hiển thị nội dung cho bước hiện tại
  const renderStepContent = () => {
    switch (currentStep) {
      case 'input':
        return <BookingInput onParsedData={handleParsedData} onSuccess={() => {}} />;
      case 'review':
        return (
          <div className="space-y-6">
            <ParsedReviewForm 
              data={parsedData} 
              onBack={handleBack} 
            />
            <div className="flex justify-between pt-4 border-t border-gray-200">
              <button
                onClick={handleBack}
                className="text-gray-600 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                Quay lại
              </button>
              <button
                onClick={() => handleNext('calendar')}
                className="bg-[#FF5A5F] text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        );
      case 'calendar':
        return (
          <div className="space-y-6">
            <CalendarAddButton 
              eventData={parsedData} 
              onSuccess={() => handleNext('invoice')}
            />
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="text-gray-600 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                Quay lại
              </button>
              <button
                onClick={() => handleNext('invoice')}
                className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-all duration-200"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        );
      case 'invoice':
        return (
          <div className="space-y-6">
            <InvoiceMaker 
              bookingData={parsedData} 
              onSuccess={handlePdfGenerated}
            />
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="text-gray-600 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                Quay lại
              </button>
              <button
                onClick={() => handleNext('input')}
                className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-all duration-200"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        );
      case 'send':
        return (
          <div className="space-y-6">
            <SendInvoiceStatus 
              pdfUrl={generatedPdfUrl} 
              phone={parsedData?.phone || ''}
              onSuccess={handleComplete}
            />
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="text-gray-600 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                Quay lại
              </button>
              <button
                onClick={handleComplete}
                className="bg-[#FF5A5F] text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200"
              >
                Hoàn thành
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  // Hiển thị thanh tiến trình
  const renderProgressBar = () => {
    if (currentStep === 'input') return null;
    
    const steps: { key: Step; label: string }[] = [
      { key: 'input', label: 'Nhập thông tin' },
      { key: 'review', label: 'Xem lại' },
      { key: 'calendar', label: 'Thêm lịch' },
      { key: 'invoice', label: 'Tạo hóa đơn' },
      { key: 'send', label: 'Gửi hóa đơn' }
    ];
    
    const currentIndex = steps.findIndex(step => step.key === currentStep);
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div 
              key={step.key} 
              className="flex flex-col items-center"
              onClick={() => {
                // Chỉ cho phép quay lại các bước trước đó
                if (index < currentIndex) {
                  setCurrentStep(step.key);
                }
              }}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < currentIndex 
                    ? 'bg-green-500 text-white cursor-pointer' 
                    : index === currentIndex 
                      ? 'bg-[#FF5A5F] text-white' 
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index + 1}
              </div>
              <span 
                className={`mt-2 text-xs ${
                  index === currentIndex ? 'font-medium text-[#FF5A5F]' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute top-0 h-1 bg-gray-200 w-full"></div>
          <div 
            className="absolute top-0 h-1 bg-[#FF5A5F] transition-all duration-300"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Web Calendar Booking</h1>
        <div className="flex space-x-2">
          <CustomerManager onSelectCustomer={handleSelectCustomer} />
          <BookingManager onSelectBooking={(booking) => setParsedData(booking)} />
          <PaymentManager onSelectPayment={handleSelectPayment} />
        </div>
      </div>
      
      {renderProgressBar()}
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">{getStepTitle()}</h2>
        {renderStepContent()}
      </div>
      
      <footer className="text-center text-sm text-gray-500 mt-8">
        &copy; {new Date().getFullYear()} Web Calendar Booking. Tất cả quyền được bảo lưu.
      </footer>
    </div>
  );
}
