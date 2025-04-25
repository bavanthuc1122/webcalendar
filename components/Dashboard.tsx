'use client';

import { useState, useEffect } from 'react';
import BookingInput from './BookingInput';
import BatchTextAnalyzer from './BatchTextAnalyzer';
import BatchReviewList from './BatchReviewList';
import ParsedReviewForm from './ParsedReviewForm';
import CalendarAddButton from './CalendarAddButton';
import InvoiceMaker from './InvoiceMaker';
import SendInvoiceStatus from './SendInvoiceStatus';
import SessionCompletionForm from './SessionCompletionForm';
import CustomerManager from './CustomerManager';
import BookingManager from './BookingManager';
import PaymentManager from './PaymentManager';
import { BookingData, CustomerData, PaymentSettings, saveBooking } from '../lib/db';

// Các bước trong quy trình
type Step = 'input' | 'batch-review' | 'review' | 'calendar' | 'invoice' | 'complete';

export default function Dashboard() {
  // State cho dữ liệu và bước hiện tại
  const [parsedData, setParsedData] = useState<BookingData | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('input');
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentSettings | null>(null);
  const [showBatchInput, setShowBatchInput] = useState<boolean>(false);
  const [batchBookings, setBatchBookings] = useState<BookingData[]>([]);

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
      // Nếu đến từ batch-review, quay lại batch-review
      if (batchBookings.length > 0) {
        setCurrentStep('batch-review');
      } else {
        // Nếu không, quay lại input
        setParsedData(null);
        setCurrentStep('input');
      }
    } else if (currentStep === 'calendar') {
      setCurrentStep('review');
    } else if (currentStep === 'invoice') {
      setCurrentStep('calendar');
    } else if (currentStep === 'complete') {
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

    // Chuyển đến bước hoàn thành
    setCurrentStep('complete');
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

  // Xử lý khi phân tích nhiều lịch hẹn
  const handleBatchAnalyze = (results: any[]) => {
    if (results.length > 0) {
      // Đảm bảo tất cả các trường cần thiết có trong mỗi booking
      const processedResults = results.map(booking => {
        // Đảm bảo các trường số là số
        const deposit = typeof booking.deposit === 'string'
          ? parseInt(booking.deposit.replace(/\D/g, ''))
          : (booking.deposit || 0);

        const total = typeof booking.total === 'string'
          ? parseInt(booking.total.replace(/\D/g, ''))
          : (booking.total || 0);

        const duration = typeof booking.duration === 'string'
          ? parseInt(booking.duration)
          : (booking.duration || 2);

        // Đảm bảo định dạng ngày là DD/MM/YYYY
        let date = booking.date || '';
        if (date && !date.includes('/')) {
          const parts = date.split(/[.-]/);
          if (parts.length === 3) {
            date = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
          }
        }

        // Đảm bảo định dạng thời gian là HH:MM
        let time = booking.time || '';
        if (time && !time.includes(':')) {
          if (time.toLowerCase().includes('h')) {
            const timeParts = time.toLowerCase().split('h');
            const hours = timeParts[0].trim();
            const minutes = timeParts[1] ? timeParts[1].trim() : '00';
            time = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
          }
        }

        return {
          ...booking,
          deposit,
          total,
          duration,
          date,
          time,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });

      // Lưu danh sách lịch hẹn đã xử lý
      setBatchBookings(processedResults);

      if (processedResults.length === 1) {
        // Nếu chỉ có một lịch hẹn, hiển thị ngay
        setParsedData(processedResults[0]);
        setCurrentStep('review');
      } else {
        // Nếu có nhiều lịch hẹn, hiển thị danh sách để chọn
        setCurrentStep('batch-review');
      }
    }
  };

  // Hiển thị tiêu đề cho bước hiện tại
  const getStepTitle = () => {
    switch (currentStep) {
      case 'input':
        return 'Nhập thông tin đặt lịch';
      case 'batch-review':
        return 'Xem lại danh sách lịch hẹn';
      case 'review':
        return 'Xem lại thông tin';
      case 'calendar':
        return 'Thêm vào lịch';
      case 'invoice':
        return 'Quản lý hóa đơn';
      case 'complete':
        return 'Hoàn thành buổi chụp';
      default:
        return 'Web Calendar Booking';
    }
  };

  // Hiển thị nội dung cho bước hiện tại
  const renderStepContent = () => {
    switch (currentStep) {
      case 'input':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowBatchInput(!showBatchInput)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  {showBatchInput ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Nhập đơn lẻ
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      Nhập nhiều lịch
                    </>
                  )}
                </button>
              </div>
            </div>

            {showBatchInput ? (
              <BatchTextAnalyzer onAnalyzeComplete={handleBatchAnalyze} />
            ) : (
              <BookingInput onParsedData={handleParsedData} onSuccess={() => {}} />
            )}
          </div>
        );
      case 'batch-review':
        return (
          <BatchReviewList
            bookings={batchBookings}
            onSelectBooking={(booking) => {
              // Đảm bảo status có giá trị hợp lệ và các trường bắt buộc đều có
              const processedBooking: BookingData = {
                ...booking,
                status: booking.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
                createdAt: booking.createdAt || new Date().toISOString(),
                updatedAt: booking.updatedAt || new Date().toISOString()
              };
              setParsedData(processedBooking);
              setCurrentStep('review');
            }}
            onBack={() => {
              setBatchBookings([]);
              setCurrentStep('input');
            }}
            onAddAllToCalendar={() => {
              // Chuyển đến bước calendar với tất cả các lịch hẹn
              if (batchBookings.length > 0) {
                // Đảm bảo lịch hẹn đầu tiên được chọn
                const firstBooking: BookingData = {
                  ...batchBookings[0],
                  status: batchBookings[0].status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
                  createdAt: batchBookings[0].createdAt || new Date().toISOString(),
                  updatedAt: batchBookings[0].updatedAt || new Date().toISOString()
                };
                setParsedData(firstBooking);
                setCurrentStep('calendar');
              }
            }}
          />
        );
      case 'review':
        return (
          <div className="space-y-6">
            <ParsedReviewForm
              data={parsedData}
              onBack={() => {
                // Nếu đến từ batch-review, quay lại batch-review
                if (batchBookings.length > 0) {
                  setCurrentStep('batch-review');
                } else {
                  // Nếu không, quay lại input
                  setParsedData(null);
                  setCurrentStep('input');
                }
              }}
              onSubmit={(updatedData) => {
                // Cập nhật dữ liệu đã chỉnh sửa
                if (parsedData) {
                  setParsedData({
                    ...parsedData,
                    ...updatedData,
                    status: 'pending'
                  });
                }
                // Chuyển đến bước tiếp theo
                handleNext('calendar');
              }}
            />
          </div>
        );
      case 'calendar':
        return (
          <div className="space-y-6">
            <CalendarAddButton
              eventData={{
                customer: parsedData.customer,
                time: parsedData.time,
                duration: parsedData.duration,
                date: parsedData.date,
                phone: parsedData.phone,
                deposit: parsedData.deposit,
                total: parsedData.total,
                concepts: parsedData.concepts
              }}
              batchEvents={batchBookings.length > 0 ? batchBookings.filter(b => b.customer !== parsedData.customer).map(b => ({
                customer: b.customer,
                time: b.time,
                duration: b.duration,
                date: b.date,
                phone: b.phone,
                deposit: b.deposit,
                total: b.total,
                concepts: b.concepts
              })) : undefined}
              showBatchPreview={batchBookings.length > 1}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Tạo hóa đơn</h3>
                <InvoiceMaker
                  bookingData={parsedData}
                  onSuccess={handlePdfGenerated}
                />
              </div>

              {generatedPdfUrl && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Gửi hóa đơn</h3>
                  <SendInvoiceStatus
                    pdfUrl={generatedPdfUrl}
                    phone={parsedData?.phone || ''}
                    onSuccess={() => handleNext('complete')}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="text-gray-600 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                Quay lại
              </button>
              {generatedPdfUrl ? (
                <button
                  onClick={() => handleNext('complete')}
                  className="bg-[#FF5A5F] text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200"
                >
                  Tiếp tục
                </button>
              ) : (
                <button
                  onClick={() => handleNext('complete')}
                  className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-all duration-200"
                >
                  Bỏ qua
                </button>
              )}
            </div>
          </div>
        );
      case 'complete':
        return (
          <div className="space-y-6">
            <SessionCompletionForm
              bookingData={parsedData}
              pdfUrl={generatedPdfUrl}
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
    // Luôn hiển thị thanh tiến trình, ngay cả khi ở bước input
    const steps: { key: Step; label: string }[] = [
      { key: 'input', label: 'Nhập thông tin' },
      { key: 'review', label: 'Xem lại' },
      { key: 'calendar', label: 'Thêm lịch' }
    ];

    const currentIndex = steps.findIndex(step => step.key === currentStep);

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <button
              key={step.key}
              className="flex flex-col items-center bg-transparent border-none cursor-pointer"
              onClick={() => {
                // Chỉ cho phép quay lại các bước trước đó hoặc bước hiện tại
                if (index <= currentIndex) {
                  setCurrentStep(step.key);
                }
              }}
              disabled={index > currentIndex}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < currentIndex
                    ? 'bg-green-500 text-white'
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
            </button>
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
          <a
            href="/customers"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Quản lý khách hàng
          </a>

          <CustomerManager onSelectCustomer={handleSelectCustomer} />
          <BookingManager onSelectBooking={(booking) => setParsedData(booking)} />
          <PaymentManager onSelectPayment={handleSelectPayment} />
        </div>
      </div>

      {/* Luôn hiển thị thanh tiến trình */}
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
