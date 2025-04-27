'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác thực email của bạn...');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token xác thực không được cung cấp');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        
        if (response.redirected) {
          // Nếu API chuyển hướng, chúng ta cũng chuyển hướng
          router.push('/auth/login?verified=true');
          return;
        }
        
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage('Email của bạn đã được xác thực thành công!');
          
          // Chuyển hướng đến trang đăng nhập sau 3 giây
          setTimeout(() => {
            router.push('/auth/login?verified=true');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Có lỗi xảy ra khi xác thực email');
        }
      } catch (error) {
        console.error('Lỗi khi xác thực email:', error);
        setStatus('error');
        setMessage('Có lỗi xảy ra khi xác thực email');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Xác thực Email</h1>
        
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">{message}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Thành công!</p>
            <p>{message}</p>
            <p className="mt-2 text-sm">Bạn sẽ được chuyển hướng đến trang đăng nhập...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Lỗi!</p>
            <p>{message}</p>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Link href="/auth/login" className="text-blue-500 hover:text-blue-600">
            Quay lại trang đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
