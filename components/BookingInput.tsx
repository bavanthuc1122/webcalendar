'use client';

import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Toast from './Toast';
import PromptManager, { PromptTemplate } from './PromptManager';

interface BookingInputProps {
  onParsedData: (data: any) => void;
  onSuccess?: () => void;
}

export default function BookingInput({ onParsedData, onSuccess }: BookingInputProps) {
  const [bookingText, setBookingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [toast, setToast] = useState({
    message: '',
    type: 'success' as 'success' | 'error',
    isVisible: false
  });

  // Khôi phục văn bản đã nhập từ localStorage khi component được tải
  useEffect(() => {
    const savedText = localStorage.getItem('bookingInputText');
    if (savedText) {
      setBookingText(savedText);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingText.trim()) return;

    // Lưu văn bản vào localStorage
    localStorage.setItem('bookingInputText', bookingText);

    setIsLoading(true);
    try {
      // Kiểm tra API key
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) {
        console.error('API key không được cấu hình');
        throw new Error('API key không được cấu hình');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      // Sử dụng model gemini-1.5-flash cho Gemini 2.0
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Sử dụng prompt tùy chỉnh hoặc mặc định
      const promptTemplate = currentPrompt || `
        Phân tích thông tin đặt lịch sau và trả về dưới dạng JSON hợp lệ:
        {{input}}

        Trả về JSON với các trường:
        - customer: tên khách hàng (chỉ lấy tên người, không bao gồm các thông tin khác)
        - time: giờ bắt đầu chụp (định dạng HH:MM, ví dụ: 10:00, 14:30)
        - duration: thời lượng chụp tính bằng giờ (mặc định là 2 nếu không có thông tin)
        - deposit: tiền đặt cọc (chỉ số, không có đơn vị)
        - total: tổng chi phí (chỉ số, không có đơn vị)
        - phone: số điện thoại
        - date: ngày chụp (định dạng DD/MM/YYYY)
        - concepts: các ý tưởng chụp (nếu có)

        Quy tắc phân tích:
        - Nếu thấy "10h" hoặc tương tự, chuyển thành "10:00"
        - Nếu thấy "10h30" hoặc tương tự, chuyển thành "10:30"
        - Nếu thấy "950k" hoặc tương tự, chuyển thành 950000 (không có đơn vị)
        - Nếu thấy ngày dạng "25.5.2025" hoặc tương tự, chuyển thành "25/05/2025"
        - Nếu không có thông tin về thời lượng, mặc định là 2 giờ

        Chỉ trả về JSON, không thêm bất kỳ văn bản nào khác.
      `;

      // Thay thế placeholder {{input}} bằng văn bản đầu vào
      const prompt = promptTemplate.replace(/{{input}}/g, bookingText);

      console.log('Đang gửi prompt đến Gemini...');

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      console.log('Phản hồi từ Gemini:', text);

      // Tìm và phân tích phần JSON từ phản hồi
      let parsedData: any;
      try {
        // Thử phân tích trực tiếp nếu phản hồi là JSON hợp lệ
        parsedData = JSON.parse(text);
      } catch (jsonError) {
        console.log('Không thể phân tích trực tiếp, thử tìm JSON trong văn bản...');
        // Nếu không thành công, thử tìm JSON trong văn bản
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedData = JSON.parse(jsonMatch[0]);
          } catch (matchError) {
            console.error('Lỗi khi phân tích JSON từ phần khớp:', matchError);
            throw new Error('Không thể phân tích JSON từ phản hồi');
          }
        } else {
          console.error('Không tìm thấy JSON trong phản hồi');
          throw new Error('Không tìm thấy JSON trong phản hồi');
        }
      }

      // Kiểm tra dữ liệu đã phân tích
      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('Dữ liệu phân tích không hợp lệ');
      }

      console.log('Dữ liệu đã phân tích:', parsedData);

      // Kiểm tra các trường bắt buộc
      const requiredFields = ['customer', 'concepts', 'duration', 'deposit', 'total', 'phone', 'date'];
      const missingFields = requiredFields.filter(field => !(field in parsedData));

      if (missingFields.length > 0) {
        console.error('Thiếu các trường:', missingFields);
        throw new Error(`Thiếu các trường: ${missingFields.join(', ')}`);
      }

      onParsedData(parsedData);
      setToast({
        message: 'Phân tích dữ liệu thành công!',
        type: 'success',
        isVisible: true
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Lỗi khi phân tích dữ liệu:', error);
      console.error('Chi tiết lỗi:', error.message);
      setToast({
        message: `Có lỗi xảy ra khi phân tích dữ liệu: ${error.message}. Vui lòng thử lại.`,
        type: 'error',
        isVisible: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleSelectPrompt = (promptContent: string) => {
    setCurrentPrompt(promptContent);
  };

  const handleSavePrompt = (prompt: PromptTemplate) => {
    console.log('Đã lưu prompt:', prompt);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <div className="w-full">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Nhập thông tin đặt lịch</h2>
          <button
            type="button"
            onClick={toggleSettings}
            className="text-gray-500 hover:text-[#FF5A5F] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {showSettings && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Cài đặt Prompt</h3>
            <PromptManager
              onSelectPrompt={handleSelectPrompt}
              onSavePrompt={handleSavePrompt}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="bookingText" className="block text-sm font-medium text-gray-700 mb-1">
              Thông tin đặt lịch
            </label>
            <textarea
              id="bookingText"
              className="w-full h-[120px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
              placeholder="Dán thông tin đặt lịch vào đây..."
              value={bookingText}
              onChange={(e) => setBookingText(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                type="button"
                onClick={toggleSettings}
                className="text-sm text-gray-600 hover:text-[#FF5A5F] flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {showSettings ? 'Ẩn cài đặt' : 'Hiện cài đặt'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#FF5A5F] text-white py-2 px-6 rounded-lg hover:bg-opacity-90 transition-all duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                'Phân tích'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}