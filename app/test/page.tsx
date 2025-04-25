'use client';

import { useState } from 'react';
import BookingInput from '../../components/BookingInput';
import ParsedReviewForm from '../../components/ParsedReviewForm';
import { mockParsedData } from '../../test-mock-data';

export default function TestPage() {
  const [parsedData, setParsedData] = useState(null);
  const [showMockData, setShowMockData] = useState(false);

  const handleParsedData = (data) => {
    setParsedData(data);
  };

  const handleShowMockData = () => {
    setParsedData(mockParsedData);
    setShowMockData(true);
  };

  const handleReset = () => {
    setParsedData(null);
    setShowMockData(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Kiểm thử Web Calendar</h1>
        
        {!parsedData ? (
          <>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Hướng dẫn kiểm thử</h2>
              <p className="mb-2">1. Sử dụng dữ liệu mẫu từ file <code>test-data.txt</code></p>
              <p className="mb-2">2. Dán vào ô nhập liệu và nhấn "Gửi" để kiểm tra chức năng phân tích</p>
              <p>3. Hoặc nhấn nút "Dùng dữ liệu mẫu" để bỏ qua bước gọi API</p>
            </div>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleShowMockData}
                className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-all duration-200"
              >
                Dùng dữ liệu mẫu
              </button>
            </div>
            <BookingInput onParsedData={handleParsedData} />
          </>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleReset}
                className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-all duration-200"
              >
                Quay lại
              </button>
            </div>
            <ParsedReviewForm data={parsedData} />
          </>
        )}
      </div>
    </main>
  );
}