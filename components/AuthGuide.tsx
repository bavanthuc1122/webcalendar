'use client';

import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface AuthGuideProps {
  type: 'google' | 'zalo';
}

export default function AuthGuide({ type }: AuthGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const googleGuideSteps = [
    {
      title: 'Tạo dự án trên Google Cloud Console',
      content: 'Truy cập Google Cloud Console (https://console.cloud.google.com/) và tạo một dự án mới.'
    },
    {
      title: 'Bật Google Calendar API',
      content: 'Trong dự án, vào "API & Services" > "Library" và tìm kiếm "Google Calendar API". Nhấp vào và bật API.'
    },
    {
      title: 'Tạo thông tin xác thực',
      content: 'Vào "API & Services" > "Credentials" và tạo OAuth 2.0 Client ID. Chọn loại ứng dụng là "Web application".'
    },
    {
      title: 'Thiết lập URI chuyển hướng',
      content: 'Thêm URI chuyển hướng: http://localhost:3000/api/auth/callback/google (cho môi trường phát triển) và https://your-domain.com/api/auth/callback/google (cho môi trường sản xuất).'
    },
    {
      title: 'Lấy Client ID và Client Secret',
      content: 'Sau khi tạo, bạn sẽ nhận được Client ID và Client Secret. Lưu các giá trị này vào file .env.local của dự án.'
    },
    {
      title: 'Thiết lập phạm vi truy cập',
      content: 'Đảm bảo rằng bạn đã thêm phạm vi "https://www.googleapis.com/auth/calendar" vào cấu hình OAuth.'
    },
    {
      title: 'Tạo Service Account (tùy chọn)',
      content: 'Nếu bạn muốn sử dụng Service Account thay vì OAuth, hãy tạo Service Account và tải xuống file JSON chứa khóa. Lưu đường dẫn đến file này trong biến môi trường GOOGLE_APPLICATION_CREDENTIALS.'
    }
  ];

  const zaloGuideSteps = [
    {
      title: 'Đăng ký Zalo Official Account',
      content: 'Truy cập Zalo Official Account (https://oa.zalo.me/) và đăng ký tài khoản.'
    },
    {
      title: 'Tạo Official Account',
      content: 'Sau khi đăng nhập, tạo một Official Account mới hoặc sử dụng tài khoản hiện có.'
    },
    {
      title: 'Vào phần quản lý',
      content: 'Vào phần "Quản lý" > "Tài khoản" > "Tích hợp" để lấy thông tin API.'
    },
    {
      title: 'Lấy OA ID và Secret Key',
      content: 'Tại đây, bạn sẽ thấy OA ID và Secret Key. Lưu các giá trị này vào file .env.local của dự án.'
    },
    {
      title: 'Tạo OA Token',
      content: 'Sử dụng OA ID và Secret Key để tạo OA Token theo hướng dẫn của Zalo.'
    },
    {
      title: 'Thiết lập webhook (nếu cần)',
      content: 'Nếu bạn muốn nhận thông báo từ Zalo, hãy thiết lập webhook URL.'
    }
  ];

  const steps = type === 'google' ? googleGuideSteps : zaloGuideSteps;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Hướng dẫn lấy {type === 'google' ? 'Google Calendar Token' : 'Zalo OA Token'}
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Hướng dẫn lấy {type === 'google' ? 'Google Calendar Token' : 'Zalo OA Token'}
                  </Dialog.Title>
                  <div className="mt-4 space-y-6">
                    <ol className="space-y-4">
                      {steps.map((step, index) => (
                        <li key={index} className="border-b border-gray-100 pb-4 last:border-0">
                          <p className="font-medium text-gray-800">{index + 1}. {step.title}</p>
                          <p className="mt-1 text-sm text-gray-600">{step.content}</p>
                        </li>
                      ))}
                    </ol>
                    
                    <div className="pt-2">
                      <p className="text-sm text-gray-500">
                        Sau khi hoàn thành các bước trên, bạn cần thêm các giá trị vào file .env.local của dự án.
                      </p>
                      <div className="mt-2 p-3 bg-gray-50 rounded-md font-mono text-xs">
                        {type === 'google' ? (
                          <>
                            <p>GOOGLE_CLIENT_ID=your_client_id</p>
                            <p>GOOGLE_CLIENT_SECRET=your_client_secret</p>
                            <p>GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json</p>
                          </>
                        ) : (
                          <>
                            <p>ZALO_OA_ID=your_oa_id</p>
                            <p>ZALO_SECRET_KEY=your_secret_key</p>
                            <p>ZALO_OA_TOKEN=your_oa_token</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none"
                      onClick={closeModal}
                    >
                      Đã hiểu
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
