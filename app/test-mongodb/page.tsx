'use client';

import { useState, useEffect } from 'react';

export default function TestMongoDB() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('/api/test-mongodb');
        const result = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setData(result);
        } else {
          setStatus('error');
          setError(result.message || 'Lỗi không xác định');
        }
      } catch (error) {
        setStatus('error');
        setError(error.message || 'Lỗi không xác định');
      }
    };
    
    testConnection();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Kiểm tra kết nối MongoDB</h1>
      
      {status === 'loading' && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Đang kiểm tra kết nối...</span>
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Lỗi! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {status === 'success' && data && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Thành công! </strong>
          <span className="block sm:inline">{data.message}</span>
        </div>
      )}
      
      {status === 'success' && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-xl font-semibold mb-2">Thông tin kết nối</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Trạng thái:</span> {data.connectionState}</p>
              <p><span className="font-medium">Database:</span> {data.database}</p>
            </div>
          </div>
          
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-xl font-semibold mb-2">Thống kê</h2>
            <div className="space-y-2">
              {data.stats && Object.entries(data.stats).map(([key, value]) => (
                <p key={key}><span className="font-medium">{key}:</span> {value}</p>
              ))}
            </div>
          </div>
          
          <div className="bg-white shadow rounded p-4 md:col-span-2">
            <h2 className="text-xl font-semibold mb-2">Collections ({data.collections?.length || 0})</h2>
            {data.collections && data.collections.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {data.collections.map((collection: string) => (
                  <li key={collection}>{collection}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Không có collections nào</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
