'use client';

import { useState, useEffect } from 'react';
import { useBookings } from '../lib/hooks/useBookings';
import { useCustomers } from '../lib/hooks/useCustomers';
import { BookingData } from '../lib/hooks/useBookings';
import { CustomerData } from '../lib/hooks/useCustomers';
import Toast from './Toast';
import { useRouter } from 'next/navigation';

interface BookingFormProps {
  bookingData?: BookingData;
  onSuccess?: (booking: BookingData) => void;
  onCancel?: () => void;
}

export default function BookingForm({ bookingData, onSuccess, onCancel }: BookingFormProps) {
  const router = useRouter();
  const { createBooking, updateBooking, isCreating, isUpdating } = useBookings();
  const { getCustomerByPhone, createCustomer } = useCustomers();

  const [formData, setFormData] = useState<BookingData>({
    customer: '',
    time: '',
    date: '',
    duration: 2,
    deposit: 0,
    total: 0,
    phone: '',
    concepts: '',
    status: 'pending',
  });

  const [toast, setToast] = useState({
    message: '',
    type: 'success' as 'success' | 'error',
    isVisible: false
  });

  const [isLoading, setIsLoading] = useState(false);

  // Nếu có bookingData, điền vào form
  useEffect(() => {
    if (bookingData) {
      setFormData({
        ...bookingData,
        // Đảm bảo các trường bắt buộc có giá trị
        customer: bookingData.customer || '',
        time: bookingData.time || '',
        date: bookingData.date || '',
        duration: bookingData.duration || 2,
        deposit: bookingData.deposit || 0,
        total: bookingData.total || 0,
        phone: bookingData.phone || '',
        concepts: bookingData.concepts || '',
        status: bookingData.status || 'pending',
      });
    }
  }, [bookingData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Xử lý các trường số
    if (name === 'duration' || name === 'deposit' || name === 'total') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra các trường bắt buộc
    const requiredFields = ['customer', 'time', 'date', 'phone', 'total'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof BookingData]);

    if (missingFields.length > 0) {
      setToast({
        message: `Vui lòng điền đầy đủ thông tin: ${missingFields.join(', ')}`,
        type: 'error',
        isVisible: true
      });
      return;
    }

    setIsLoading(true);

    try {
      // Kiểm tra xem khách hàng đã tồn tại chưa
      let customer = await getCustomerByPhone(formData.phone);

      // Nếu khách hàng chưa tồn tại, tạo mới
      if (!customer) {
        customer = await createCustomer({
          name: formData.customer,
          phone: formData.phone,
        });
      }

      // Chuẩn bị dữ liệu booking
      const bookingToSave: BookingData = {
        ...formData,
        customerId: customer.id || customer._id,
      };

      let savedBooking;

      // Cập nhật hoặc tạo mới booking
      if (bookingData?.id || bookingData?._id) {
        savedBooking = await updateBooking(bookingToSave);
      } else {
        savedBooking = await createBooking(bookingToSave);
      }

      setToast({
        message: bookingData ? 'Đã cập nhật lịch hẹn thành công!' : 'Đã tạo lịch hẹn thành công!',
        type: 'success',
        isVisible: true
      });

      // Gọi callback nếu có
      if (onSuccess) {
        onSuccess(savedBooking);
      } else {
        // Chuyển hướng đến trang chi tiết booking
        setTimeout(() => {
          router.push(`/booking/${savedBooking.id || savedBooking._id}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Lỗi khi lưu booking:', error);
      setToast({
        message: `Lỗi: ${error.message || 'Không thể lưu lịch hẹn'}`,
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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />

      <h2 className="text-xl font-semibold mb-4">
        {bookingData ? 'Chỉnh sửa lịch hẹn' : 'Tạo lịch hẹn mới'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
              Tên khách hàng *
            </label>
            <input
              type="text"
              id="customer"
              name="customer"
              value={formData.customer}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
              placeholder="Nhập tên khách hàng"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại *
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
              placeholder="Nhập số điện thoại"
              required
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Ngày chụp *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
              required
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Giờ chụp *
            </label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
              required
            />
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Thời lượng (giờ)
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="0.5"
              step="0.5"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
            >
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <div>
            <label htmlFor="deposit" className="block text-sm font-medium text-gray-700 mb-1">
              Tiền đặt cọc (VNĐ)
            </label>
            <input
              type="number"
              id="deposit"
              name="deposit"
              value={formData.deposit}
              onChange={handleChange}
              min="0"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
            />
          </div>

          <div>
            <label htmlFor="total" className="block text-sm font-medium text-gray-700 mb-1">
              Tổng chi phí (VNĐ) *
            </label>
            <input
              type="number"
              id="total"
              name="total"
              value={formData.total}
              onChange={handleChange}
              min="0"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="concepts" className="block text-sm font-medium text-gray-700 mb-1">
            Ý tưởng chụp
          </label>
          <textarea
            id="concepts"
            name="concepts"
            value={formData.concepts}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] h-24"
            placeholder="Nhập ý tưởng chụp (nếu có)"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || isCreating || isUpdating}
            className="px-6 py-2 bg-[#FF5A5F] text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 flex items-center"
          >
            {(isLoading || isCreating || isUpdating) ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu...
              </>
            ) : (
              'Lưu lịch hẹn'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
