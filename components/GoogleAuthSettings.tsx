'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface GoogleAuthSettingsProps {
  onSave?: (settings: { apiKey: string; clientId: string; clientSecret: string }) => void;
}

export default function GoogleAuthSettings({ onSave }: GoogleAuthSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    apiKey: '',
    clientId: '',
    clientSecret: ''
  });

  // Tải cài đặt từ localStorage khi component được tải
  useEffect(() => {
    const savedSettings = localStorage.getItem('googleAuthSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Lỗi khi phân tích cài đặt Google Auth:', error);
      }
    }
  }, []);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Lưu cài đặt vào localStorage
    localStorage.setItem('googleAuthSettings', JSON.stringify(settings));
    
    if (onSave) {
      onSave(settings);
    }
    
    closeModal();
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
                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                      Google API Key
                    </label>
                    <input
                      type="text"
                      id="apiKey"
                      name="apiKey"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={settings.apiKey}
                      onChange={handleInputChange}
                      placeholder="Nhập Google API Key"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      API Key được sử dụng để gọi Google Calendar API
                    </p>
                  </div>

                  <div>
                    <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                      Client ID
                    </label>
                    <input
                      type="text"
                      id="clientId"
                      name="clientId"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={settings.clientId}
                      onChange={handleInputChange}
                      placeholder="Nhập Client ID"
                    />
                  </div>

                  <div>
                    <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-1">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      id="clientSecret"
                      name="clientSecret"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={settings.clientSecret}
                      onChange={handleInputChange}
                      placeholder="Nhập Client Secret"
                    />
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600">
                      <strong>Hướng dẫn:</strong> Để lấy các thông tin trên, bạn cần tạo một dự án trong Google Cloud Console, 
                      kích hoạt Google Calendar API và tạo thông tin xác thực. Xem hướng dẫn chi tiết 
                      <a href="https://developers.google.com/calendar/api/quickstart/js" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800"> tại đây</a>.
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
