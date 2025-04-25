'use client';

import { useState, useEffect } from 'react';
import Toast from './Toast';
import AuthGuide from './AuthGuide';
import GoogleAuthSettings from './GoogleAuthSettings';

interface EventData {
  customer: string;
  time: string;
  duration: number;
  date: string;
  phone: string;
  deposit: number;
  total: number;
  concepts?: string;
}

interface CalendarAddButtonProps {
  eventData: EventData;
  batchEvents?: EventData[];
  onSuccess?: () => void;
  showBatchPreview?: boolean;
}

export default function CalendarAddButton({ eventData, batchEvents = [], onSuccess, showBatchPreview = false }: CalendarAddButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({
    message: '',
    type: 'success' as 'success' | 'error',
    isVisible: false
  });
  // Lưu trữ cài đặt xác thực
  const [googleAuthConfig, setGoogleAuthConfig] = useState({
    apiKey: '',
    clientId: '',
    clientSecret: ''
  });
  const [isConfigured, setIsConfigured] = useState(false);
  // State để hiển thị/ẩn xem trước tất cả lịch hẹn
  const [showBatchPreviewState, setShowBatchPreviewState] = useState(showBatchPreview);

  // Tải cài đặt xác thực từ localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('googleAuthSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setGoogleAuthConfig(parsedSettings);
        setIsConfigured(!!parsedSettings.apiKey);
      } catch (error) {
        console.error('Lỗi khi phân tích cài đặt Google Auth:', error);
      }
    }
  }, []);

  // Hàm định dạng thời gian kết thúc
  const formatEndTime = (startTime: string, durationHours: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);

    // Tính toán tổng số phút
    let totalMinutes = hours * 60 + minutes + durationHours * 60;

    // Chuyển đổi lại thành giờ:phút
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;

    // Định dạng lại thành chuỗi "HH:MM"
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  // Xử lý khi lưu cài đặt xác thực
  const handleSaveAuthSettings = (settings: { apiKey: string; clientId: string; clientSecret: string }) => {
    setGoogleAuthConfig(settings);
    setIsConfigured(!!settings.apiKey);
    setToast({
      message: 'Đã lưu cài đặt xác thực Google Calendar',
      type: 'success',
      isVisible: true
    });
  };

  // Hàm tạo dữ liệu sự kiện từ thông tin đặt lịch
  const createEventData = (event: EventData) => {
    const { customer, time, duration, date, phone, deposit, total, concepts } = event;

    // Chuyển đổi ngày và giờ thành đối tượng Date
    const [day, month, year] = date.split('/').map(Number);
    const [hour, minute] = time.split(':').map(Number);

    const startDate = new Date(year, month - 1, day, hour, minute);
    const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);

    // Tạo mô tả sự kiện
    const description = `
      Số điện thoại: ${phone}
      Tiền đặt cọc: ${deposit.toLocaleString('vi-VN')}đ
      Tổng chi phí: ${total.toLocaleString('vi-VN')}đ
      ${concepts ? `Ý tưởng chụp: ${concepts}` : ''}
    `;

    return {
      summary: `Chụp ảnh: ${customer}`,
      description: description.trim(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };
  };

  // Thêm một sự kiện vào Google Calendar
  const handleAddToCalendar = async () => {
    setIsLoading(true);
    try {
      // Tạo dữ liệu sự kiện
      const eventPayload = createEventData(eventData);

      // Gọi API để thêm sự kiện vào Google Calendar
      const response = await fetch('/api/add-to-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      });

      if (!response.ok) {
        throw new Error('Không thể thêm sự kiện vào lịch');
      }

      await response.json();

      setToast({
        message: 'Đã thêm sự kiện vào Google Calendar!',
        type: 'success',
        isVisible: true
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Lỗi khi thêm sự kiện vào lịch:', error);
      setToast({
        message: 'Có lỗi xảy ra khi thêm sự kiện vào lịch',
        type: 'error',
        isVisible: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Thêm nhiều sự kiện vào Google Calendar
  const handleAddBatchToCalendar = async () => {
    if (batchEvents.length === 0) return;

    setIsLoading(true);
    try {
      // Tạo dữ liệu cho tất cả các sự kiện
      const eventPayloads = [eventData, ...batchEvents].map(event => createEventData(event));

      // Đếm số sự kiện đã thêm thành công
      let successCount = 0;
      let errorCount = 0;

      // Thêm từng sự kiện vào Google Calendar
      for (const eventPayload of eventPayloads) {
        try {
          const response = await fetch('/api/add-to-calendar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventPayload),
          });

          if (!response.ok) {
            errorCount++;
            console.error(`Lỗi khi thêm sự kiện "${eventPayload.summary}": ${response.statusText}`);
            continue;
          }

          await response.json();
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Lỗi khi thêm sự kiện "${eventPayload.summary}":`, error);
        }
      }

      // Hiển thị thông báo kết quả
      if (successCount > 0) {
        setToast({
          message: `Đã thêm ${successCount} sự kiện vào Google Calendar${errorCount > 0 ? `, ${errorCount} lỗi` : ''}!`,
          type: 'success',
          isVisible: true
        });

        if (onSuccess) onSuccess();
      } else {
        setToast({
          message: 'Không thể thêm bất kỳ sự kiện nào vào lịch',
          type: 'error',
          isVisible: true
        });
      }
    } catch (error) {
      console.error('Lỗi khi thêm nhiều sự kiện vào lịch:', error);
      setToast({
        message: 'Có lỗi xảy ra khi thêm sự kiện vào lịch',
        type: 'error',
        isVisible: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDetails = () => {
    // Xử lý khi người dùng muốn chỉnh sửa chi tiết
    // Có thể thực hiện bằng cách gọi một callback từ props
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
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Thêm vào Google Calendar</h3>
          <div className="flex items-center space-x-2">
            <GoogleAuthSettings onSave={handleSaveAuthSettings} />
            <AuthGuide type="google" />
          </div>
        </div>

        {!isConfigured ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">Chưa cấu hình Google Calendar</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Bạn cần cấu hình API Key của Google Calendar trước khi có thể thêm sự kiện. Nhấp vào nút "Cài đặt Google Calendar" ở trên.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          {batchEvents && batchEvents.length > 0 ? (
            <button
              onClick={handleAddBatchToCalendar}
              disabled={isLoading || !isConfigured}
              className={`w-full py-3 px-4 rounded-lg flex items-center justify-center ${
                isConfigured
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } transition-all duration-200`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang thêm vào lịch...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Thêm tất cả ({batchEvents.length + 1} lịch) vào Google Calendar
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleAddToCalendar}
              disabled={isLoading || !isConfigured}
              className={`w-full py-3 px-4 rounded-lg flex items-center justify-center ${
                isConfigured
                  ? 'bg-[#FF5A5F] text-white hover:bg-opacity-90'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } transition-all duration-200`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang thêm vào lịch...
                </>
              ) : (
                'Thêm vào Google Calendar'
              )}
            </button>
          )}
          <button
            onClick={handleEditDetails}
            disabled={!isConfigured}
            className={`w-full py-2 px-4 rounded-lg border ${
              isConfigured
                ? 'text-gray-600 border-gray-300 hover:bg-gray-50'
                : 'text-gray-400 border-gray-200 cursor-not-allowed'
            } transition-all duration-200`}
          >
            Chỉnh sửa chi tiết
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 w-full">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-medium text-gray-700">Xem trước sự kiện</h4>
                {batchEvents && batchEvents.length > 0 && (
                  <span className="text-xs text-gray-500">
                    Hiển thị {showBatchPreviewState ? `tất cả ${batchEvents.length + 1} lịch` : '1 trong số ' + (batchEvents.length + 1) + ' lịch'}
                  </span>
                )}
              </div>

              {/* Hiển thị lịch hẹn hiện tại */}
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-[#4285F4] mt-1 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium">{eventData.customer}</p>
                    <div className="text-sm text-gray-600 mt-1">
                      <p className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {eventData.date}
                      </p>
                      <p className="flex items-center mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {eventData.time} - {formatEndTime(eventData.time, eventData.duration)}
                      </p>
                      {eventData.concepts && (
                        <p className="flex items-start mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <span>{eventData.concepts}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hiển thị các lịch hẹn khác nếu có và showBatchPreviewState = true */}
              {showBatchPreviewState && batchEvents && batchEvents.length > 0 && (
                <>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Các lịch hẹn khác ({batchEvents.length})</h5>
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                      {batchEvents.map((event, index) => (
                        <div key={index} className="flex items-start border-b border-gray-100 pb-3">
                          <div className="w-4 h-4 rounded-full bg-green-500 mt-1 mr-2 flex-shrink-0"></div>
                          <div className="w-full">
                            <p className="font-medium text-sm">{event.customer}</p>
                            <div className="text-xs text-gray-600 mt-1">
                              <p className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {event.date}
                              </p>
                              <p className="flex items-center mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {event.time} - {formatEndTime(event.time, event.duration)}
                              </p>
                              <p className="flex items-center mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {event.phone}
                              </p>
                              <div className="flex justify-between mt-0.5">
                                <p className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Cọc: {event.deposit.toLocaleString('vi-VN')}đ
                                </p>
                                <p className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Tổng: {event.total.toLocaleString('vi-VN')}đ
                                </p>
                              </div>
                              {event.concepts && (
                                <p className="flex items-start mt-1 text-xs">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                  </svg>
                                  <span className="line-clamp-2">{event.concepts}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 text-center">
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Cuộn lên trên
                    </button>
                  </div>
                </>
              )}

              {/* Nút hiển thị/ẩn tất cả lịch hẹn */}
              {batchEvents && batchEvents.length > 0 && (
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setShowBatchPreviewState(!showBatchPreviewState)}
                    className="text-xs text-gray-600 hover:text-gray-800 flex items-center mx-auto"
                  >
                    {showBatchPreviewState ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        Ẩn bớt
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Xem tất cả lịch hẹn
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
