'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useQuery } from 'react-query';

interface GoogleAuthSettingsProps {
  onSave?: (settings: { apiKey: string; clientId: string; clientSecret: string; refreshToken?: string }) => void;
}

export default function GoogleAuthSettings({ onSave }: GoogleAuthSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    apiKey: '',
    clientId: '',
    clientSecret: '',
    refreshToken: ''
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
    details?: string;
    timestamp?: number;
  } | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Tải cài đặt từ API
  const { data: googleCalendarConfig } = useQuery(['googleCalendarConfig'], async () => {
    try {
      const response = await fetch('/api/settings?type=googleCalendar');
      if (!response.ok) {
        throw new Error('Lỗi khi lấy cấu hình Google Calendar');
      }
      return response.json();
    } catch (error) {
      console.error('Lỗi khi lấy cấu hình Google Calendar:', error);
      // Fallback to localStorage if API fails
      const savedSettings = localStorage.getItem('googleAuthSettings');
      return savedSettings ? JSON.parse(savedSettings) : {
        apiKey: '',
        clientId: '',
        clientSecret: ''
      };
    }
  });

  // Tải trạng thái kết nối từ localStorage khi component được mount
  useEffect(() => {
    const savedStatus = localStorage.getItem('googleCalendarConnectionStatus');
    if (savedStatus) {
      try {
        const parsedStatus = JSON.parse(savedStatus);
        // Chỉ hiển thị trạng thái kết nối nếu nó được lưu trong vòng 24 giờ
        if (parsedStatus.timestamp && Date.now() - parsedStatus.timestamp < 24 * 60 * 60 * 1000) {
          setConnectionStatus(parsedStatus);
        }
      } catch (error) {
        console.error('Lỗi khi đọc trạng thái kết nối từ localStorage:', error);
      }
    }
  }, []);

  // Cập nhật state khi có dữ liệu từ API
  useEffect(() => {
    if (googleCalendarConfig && googleCalendarConfig.length > 0) {
      // Tìm cấu hình mặc định hoặc lấy cấu hình đầu tiên
      const defaultConfig = googleCalendarConfig.find(config => config.isDefault) || googleCalendarConfig[0];

      if (defaultConfig && defaultConfig.data) {
        // Lưu cả refreshToken nếu có
        setSettings({
          apiKey: defaultConfig.data.apiKey || '',
          clientId: defaultConfig.data.clientId || '',
          clientSecret: defaultConfig.data.clientSecret || '',
          refreshToken: defaultConfig.data.refreshToken || ''
        });

        // Nếu có refreshToken, hiển thị thông báo kết nối thành công
        if (defaultConfig.data.refreshToken) {
          const statusData = {
            success: true,
            message: 'Kết nối Google Calendar thành công!',
            details: 'Đã xác thực OAuth2 với Google Calendar API',
            timestamp: Date.now()
          };

          setConnectionStatus(statusData);
          localStorage.setItem('googleCalendarConnectionStatus', JSON.stringify(statusData));

          // Log để debug
          console.log('Đã tìm thấy refresh token trong cấu hình:', !!defaultConfig.data.refreshToken);
        }
      }
    } else {
      // Fallback to localStorage if API returns no data
      const savedSettings = localStorage.getItem('googleAuthSettings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(parsedSettings);
        } catch (error) {
          console.error('Lỗi khi phân tích cài đặt Google Auth:', error);
        }
      }
    }
  }, [googleCalendarConfig]);

  // Hàm bắt đầu kiểm tra MongoDB định kỳ
  const startPollingForAuthStatus = () => {
    setIsPolling(true);

    // Dừng polling hiện tại nếu có
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    console.log('Bắt đầu kiểm tra MongoDB định kỳ để tìm refresh token');

    // Bắt đầu polling mới
    const interval = setInterval(async () => {
      try {
        console.log('Đang kiểm tra cấu hình Google Calendar trong MongoDB...');

        // Kiểm tra cấu hình Google Calendar trong MongoDB
        const response = await fetch('/api/settings?type=googleCalendar');
        if (response.ok) {
          const configs = await response.json();
          console.log('Số lượng cấu hình Google Calendar tìm thấy:', configs?.length || 0);

          if (configs && configs.length > 0) {
            // Log tất cả cấu hình để debug
            configs.forEach((config: any, index: number) => {
              console.log(`Cấu hình ${index + 1}:`, {
                id: config._id,
                isDefault: config.isDefault,
                hasClientId: !!config?.data?.clientId,
                hasClientSecret: !!config?.data?.clientSecret,
                hasRefreshToken: !!config?.data?.refreshToken,
                clientId: config?.data?.clientId?.substring(0, 10) + '...',
                refreshTokenPrefix: config?.data?.refreshToken ? config.data.refreshToken.substring(0, 10) + '...' : 'không có'
              });
            });

            // Tìm cấu hình có refresh token
            const configWithRefreshToken = configs.find((config: any) =>
              config.data && config.data.refreshToken && config.data.refreshToken.length > 0
            );

            if (configWithRefreshToken) {
              console.log('Đã tìm thấy cấu hình với refresh token:', {
                id: configWithRefreshToken._id,
                isDefault: configWithRefreshToken.isDefault,
                refreshTokenPrefix: configWithRefreshToken.data.refreshToken.substring(0, 10) + '...'
              });

              // Kiểm tra xem có refresh token không
              if (configWithRefreshToken.data && configWithRefreshToken.data.refreshToken) {
                console.log('Đã tìm thấy refresh token trong MongoDB!');

                // Cập nhật settings với refresh token
                setSettings(prev => ({
                  ...prev,
                  refreshToken: configWithRefreshToken.data.refreshToken
                }));

                // Hiển thị thông báo xác thực thành công
                const statusData = {
                  success: true,
                  message: 'Xác thực Google Calendar thành công!',
                  details: 'Đã nhận được refresh token từ Google. Bạn có thể nhấn "Lưu cài đặt" để hoàn tất.',
                  timestamp: Date.now()
                };

                setConnectionStatus(statusData);
                localStorage.setItem('googleCalendarConnectionStatus', JSON.stringify(statusData));

                // Dừng polling
                stopPollingForAuthStatus();

                console.log('Đã cập nhật UI với refresh token từ MongoDB');
              } else {
                console.log('Không tìm thấy refresh token trong cấu hình MongoDB');
              }
            }
          }
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra cấu hình Google Calendar:', error);
      }
    }, 3000); // Kiểm tra mỗi 3 giây

    setPollingInterval(interval);
  };

  // Hàm dừng kiểm tra MongoDB định kỳ
  const stopPollingForAuthStatus = () => {
    setIsPolling(false);

    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Dừng polling khi component unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setIsOpen(false);
    // Dừng polling khi đóng modal
    stopPollingForAuthStatus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
    // Xóa trạng thái kết nối khi thay đổi cấu hình
    setConnectionStatus(null);
  };

  // Kiểm tra kết nối Google Calendar
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      const response = await fetch('/api/test-google-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        // Kiểm tra xem có phải OAuth2 không
        if (data.auth_type === 'oauth2' && data.data?.auth_url) {
          // Mã hóa client_id và client_secret để truyền qua state
          const stateData = {
            client_id: settings.clientId,
            client_secret: settings.clientSecret
          };
          const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

          // Thêm state vào URL xác thực
          const authUrl = new URL(data.data.auth_url);
          authUrl.searchParams.set('state', state);

          // Mở tab mới để xác thực với Google
          window.open(authUrl.toString(), '_blank', 'noopener,noreferrer');

          // Hiển thị thông báo đang chờ xác thực
          const statusData = {
            success: true,
            message: 'Đang chờ xác thực từ Google...',
            details: 'Vui lòng hoàn tất xác thực trong tab mới. Sau khi xác thực thành công, hãy quay lại tab này và nhấn "Lưu cài đặt".',
            timestamp: Date.now()
          };

          setConnectionStatus(statusData);

          // Bắt đầu kiểm tra MongoDB định kỳ để biết khi nào xác thực hoàn tất
          startPollingForAuthStatus();
          return;
        }

        const statusData = {
          success: true,
          message: data.message || 'Kết nối thành công!',
          details: data.data ? `API: ${data.data.api_name || 'Google Calendar'}, Phiên bản: ${data.data.api_version || 'v3'}` : undefined,
          timestamp: Date.now()
        };

        setConnectionStatus(statusData);

        // Lưu trạng thái kết nối vào localStorage
        localStorage.setItem('googleCalendarConnectionStatus', JSON.stringify(statusData));
      } else {
        const statusData = {
          success: false,
          message: data.error || 'Kết nối thất bại!',
          details: data.details,
          timestamp: Date.now()
        };

        setConnectionStatus(statusData);

        // Lưu trạng thái kết nối vào localStorage
        localStorage.setItem('googleCalendarConnectionStatus', JSON.stringify(statusData));
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra kết nối:', error);

      const statusData = {
        success: false,
        message: 'Lỗi khi kiểm tra kết nối',
        details: error instanceof Error ? error.message : 'Lỗi không xác định',
        timestamp: Date.now()
      };

      setConnectionStatus(statusData);

      // Lưu trạng thái kết nối vào localStorage
      localStorage.setItem('googleCalendarConnectionStatus', JSON.stringify(statusData));
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = async () => {
    try {
      // Kiểm tra xem có thông báo xác thực thành công không
      const savedStatus = localStorage.getItem('googleCalendarConnectionStatus');
      let refreshTokenFromStatus = '';

      if (savedStatus) {
        try {
          const parsedStatus = JSON.parse(savedStatus);
          // Nếu có thông báo xác thực thành công trong vòng 5 phút, lấy refresh token từ API
          if (parsedStatus.success && parsedStatus.timestamp && Date.now() - parsedStatus.timestamp < 5 * 60 * 1000) {
            // Lấy cấu hình mới nhất từ API để có refresh token
            const configResponse = await fetch('/api/settings?type=googleCalendar');
            if (configResponse.ok) {
              const configs = await configResponse.json();
              if (configs && configs.length > 0) {
                const defaultConfig = configs.find((config: any) => config.isDefault) || configs[0];
                if (defaultConfig && defaultConfig.data && defaultConfig.data.refreshToken) {
                  refreshTokenFromStatus = defaultConfig.data.refreshToken;
                  console.log('Đã lấy refresh token từ API:', !!refreshTokenFromStatus);
                }
              }
            }
          }
        } catch (error) {
          console.error('Lỗi khi đọc trạng thái kết nối từ localStorage:', error);
        }
      }

      // Cập nhật settings với refresh token nếu có
      const updatedSettings = {
        ...settings,
        refreshToken: refreshTokenFromStatus || settings.refreshToken
      };

      // Lưu cài đặt vào MongoDB
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'googleCalendar',
          data: updatedSettings,
          isDefault: true
        }),
      });

      if (!response.ok) {
        throw new Error('Lỗi khi lưu cấu hình Google Calendar');
      }

      // Lưu cài đặt vào localStorage (fallback)
      localStorage.setItem('googleAuthSettings', JSON.stringify(updatedSettings));

      if (onSave) {
        onSave(updatedSettings);
      }

      // Log để debug
      console.log('Đã lưu cài đặt với refresh token:', !!updatedSettings.refreshToken);

      closeModal();
    } catch (error) {
      console.error('Lỗi khi lưu cấu hình Google Calendar:', error);

      // Fallback to localStorage
      localStorage.setItem('googleAuthSettings', JSON.stringify(settings));

      if (onSave) {
        onSave(settings);
      }

      closeModal();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Cài đặt Google Calendar
      </button>

      <Dialog open={isOpen} onClose={closeModal} className="relative z-10">
        <Transition
          show={isOpen}
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition
              show={isOpen}
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Cài đặt xác thực Google Calendar
                </h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                      OAuth Client ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="clientId"
                      name="clientId"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={settings.clientId}
                      onChange={handleInputChange}
                      placeholder="Nhập OAuth Client ID"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Client ID được sử dụng để xác thực OAuth2 với Google Calendar API
                    </p>
                  </div>

                  <div>
                    <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-1">
                      OAuth Client Secret <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="clientSecret"
                      name="clientSecret"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={settings.clientSecret}
                      onChange={handleInputChange}
                      placeholder="Nhập OAuth Client Secret"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Client Secret được sử dụng cùng với Client ID để xác thực OAuth2
                    </p>
                  </div>

                  {/* Đã xóa trường API Key vì không cần thiết */}

                  {/* Hiển thị trạng thái kết nối */}
                  {connectionStatus && (
                    <div className={`p-3 rounded-lg border ${connectionStatus.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} mb-4`}>
                      <div className="flex items-start">
                        {connectionStatus.success ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <div>
                          <p className={`text-sm font-medium ${connectionStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                            {connectionStatus.message}
                          </p>
                          {connectionStatus.details && (
                            <p className="text-xs text-gray-600 mt-1">
                              {connectionStatus.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nút kiểm tra kết nối */}
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection || !settings.clientId}
                    className={`w-full mb-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      isTestingConnection || !settings.clientId
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {isTestingConnection ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang kiểm tra kết nối...
                      </>
                    ) : (
                      'Kiểm tra kết nối'
                    )}
                  </button>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600">
                      <strong>Hướng dẫn cơ bản:</strong> Để cài đặt Google Calendar API, bạn cần:
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Đăng nhập vào <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">Google Cloud Console</a></li>
                        <li>Tạo dự án mới hoặc chọn dự án hiện có</li>
                        <li>Vào "API & Services" {'>>'} "Library" và tìm "Google Calendar API"</li>
                        <li>Nhấp vào "Google Calendar API" và nhấn "Enable" để kích hoạt</li>
                        <li>Vào "OAuth consent screen" và cấu hình thông tin ứng dụng</li>
                        <li>Thêm scope "https://www.googleapis.com/auth/calendar" vào danh sách</li>
                        <li>Sau đó, làm theo hướng dẫn cài đặt OAuth2 bên dưới</li>
                      </ol>
                      <div className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded-md border border-blue-200">
                        <strong>Hướng dẫn cài đặt OAuth2:</strong>
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                          <li>Trong Google Cloud Console, vào "Credentials" {'>>'} "Create Credentials" {'>>'} "OAuth client ID"</li>
                          <li>Chọn "Web application" làm Application type</li>
                          <li>Thêm URL của ứng dụng vào "Authorized JavaScript origins" (ví dụ: https://yourdomain.com)</li>
                          <li>Thêm URL callback vào "Authorized redirect URIs" (ví dụ: https://yourdomain.com/api/auth/callback/google)</li>
                          <li>Nhấp vào "Create" và sao chép Client ID và Client Secret</li>
                          <li>Dán Client ID và Client Secret vào các ô tương ứng ở trên</li>
                        </ol>
                      </div>
                      <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-200">
                        <strong>Lưu ý quan trọng:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>OAuth2 là <strong>bắt buộc</strong> để thêm sự kiện vào Google Calendar</li>
                          <li>Đảm bảo dự án đã được kích hoạt Google Calendar API</li>
                          <li>Cấu hình OAuth consent screen trước khi tạo OAuth client ID</li>
                          <li>Đảm bảo thêm đúng URL của ứng dụng vào danh sách được phép</li>
                        </ul>
                      </div>
                      <a href="https://developers.google.com/calendar/api/quickstart/js" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 block mt-2">Xem hướng dẫn chi tiết tại đây</a>
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none"
                    onClick={closeModal}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none"
                    onClick={handleSave}
                  >
                    Lưu cài đặt
                  </button>
                </div>
              </Dialog.Panel>
            </Transition>
          </div>
        </div>
      </Dialog>
    </>
  );
}
