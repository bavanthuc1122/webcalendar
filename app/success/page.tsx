'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'Thao tác thành công!';

  useEffect(() => {
    console.log('Trang success được tải, thông báo:', message);

    // Tự động chuyển hướng về trang chủ sau 5 giây
    const timer = setTimeout(() => {
      console.log('Chuyển hướng về trang chủ sau 5 giây');
      router.push('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router, message]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Thành công!</h2>
          <p className="text-gray-600 text-center mb-6">{message}</p>
          <p className="text-sm text-gray-500 mb-4">Bạn sẽ được chuyển hướng về trang chủ sau 5 giây...</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
