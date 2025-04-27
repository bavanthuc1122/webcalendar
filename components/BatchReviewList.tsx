'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface BookingData {
  customer: string;
  phone: string;
  date: string;
  time: string;
  duration: number;
  deposit: number;
  total: number;
  concepts?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface BatchReviewListProps {
  bookings: BookingData[];
  onSelectBooking: (booking: BookingData) => void;
  onBack: () => void;
  onAddAllToCalendar?: () => void;
}

export default function BatchReviewList({ bookings, onSelectBooking, onBack, onAddAllToCalendar }: BatchReviewListProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [selectedBookings, setSelectedBookings] = useState<boolean[]>(bookings.map(() => false));
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [editedBooking, setEditedBooking] = useState<BookingData | null>(null);

  // Định dạng ngày tháng
  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return '';

      // Nếu ngày có định dạng DD/MM/YYYY
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        return `${day}/${month}/${year}`;
      }

      return dateStr;
    } catch (error) {
      return dateStr;
    }
  };

  // Định dạng thời gian
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr;
  };

  // Định dạng số tiền
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const handleSelectBooking = (index: number) => {
    setSelectedIndex(index);
    onSelectBooking(bookings[index]);
  };

  const handleToggleSelect = (index: number) => {
    const newSelectedBookings = [...selectedBookings];
    newSelectedBookings[index] = !newSelectedBookings[index];
    setSelectedBookings(newSelectedBookings);
  };

  const handleEditBooking = (index: number) => {
    setEditingIndex(index);
    setEditedBooking({...bookings[index]});
  };

  const handleSaveEdit = () => {
    if (editingIndex >= 0 && editedBooking) {
      // Trong thực tế, bạn sẽ cần cập nhật dữ liệu trong cơ sở dữ liệu
      // Ở đây chúng ta chỉ cập nhật UI
      const newBookings = [...bookings];
      newBookings[editingIndex] = editedBooking;

      // Gọi API để cập nhật dữ liệu trong cơ sở dữ liệu
      // await updateBooking(editedBooking);

      // Cập nhật UI
      onSelectBooking(editedBooking);

      // Đóng form chỉnh sửa
      setEditingIndex(-1);
      setEditedBooking(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
    setEditedBooking(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editedBooking) return;

    const { name, value } = e.target;

    // Xử lý các trường số
    if (name === 'deposit' || name === 'total' || name === 'duration') {
      const numValue = name === 'duration'
        ? parseInt(value)
        : parseInt(value.replace(/\D/g, ''));

      setEditedBooking({
        ...editedBooking,
        [name]: isNaN(numValue) ? 0 : numValue
      });
    } else {
      setEditedBooking({
        ...editedBooking,
        [name]: value
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Danh sách lịch hẹn đã phân tích ({bookings.length})</h2>
        <div className="flex space-x-2">
          <button
            onClick={onBack}
            className="text-gray-600 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            Quay lại
          </button>
          {onAddAllToCalendar && (
            <button
              onClick={() => {
                // Chỉ thêm các lịch hẹn đã được chọn vào lịch
                if (selectedBookings.some(selected => selected)) {
                  onAddAllToCalendar();
                } else {
                  alert('Vui lòng chọn ít nhất một lịch hẹn để thêm vào lịch');
                }
              }}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Thêm vào lịch
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                      onChange={() => {
                        const allSelected = selectedBookings.every(selected => selected);
                        setSelectedBookings(bookings.map(() => !allSelected));
                      }}
                      checked={selectedBookings.length > 0 && selectedBookings.every(selected => selected)}
                    />
                    Khách hàng
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày chụp
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng chi phí
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đặt cọc
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking, index) =>
                editingIndex === index ? (
                  <tr key={index} className="bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                          checked={selectedBookings[index]}
                          onChange={() => handleToggleSelect(index)}
                        />
                        <div>
                          <input
                            type="text"
                            name="customer"
                            value={editedBooking?.customer || ''}
                            onChange={handleInputChange}
                            className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
                          />
                          <input
                            type="text"
                            name="phone"
                            value={editedBooking?.phone || ''}
                            onChange={handleInputChange}
                            className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 mt-1 w-full"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        name="date"
                        value={editedBooking?.date || ''}
                        onChange={handleInputChange}
                        className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
                        placeholder="DD/MM/YYYY"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          name="time"
                          value={editedBooking?.time || ''}
                          onChange={handleInputChange}
                          className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-20"
                          placeholder="HH:MM"
                        />
                        <input
                          type="number"
                          name="duration"
                          value={editedBooking?.duration || 0}
                          onChange={handleInputChange}
                          className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-16"
                          min="1"
                          max="8"
                        />
                        <span className="text-sm text-gray-500 self-center">h</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        name="total"
                        value={editedBooking?.total || 0}
                        onChange={handleInputChange}
                        className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        name="deposit"
                        value={editedBooking?.deposit || 0}
                        onChange={handleInputChange}
                        className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={handleSaveEdit}
                          className="text-green-600 hover:text-green-900"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-red-600 hover:text-red-900"
                        >
                          Hủy
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={index}
                    className={`hover:bg-gray-50 ${selectedIndex === index ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                          checked={selectedBookings[index]}
                          onChange={() => handleToggleSelect(index)}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{booking.customer}</div>
                          <div className="text-sm text-gray-500">{booking.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(booking.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatTime(booking.time)} ({booking.duration}h)</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(booking.total)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(booking.deposit)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => handleEditBooking(index)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleSelectBooking(index)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="text-gray-600 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200"
        >
          Quay lại
        </button>
        <div className="flex space-x-3">
          {onAddAllToCalendar && (
            <button
              onClick={onAddAllToCalendar}
              className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Thêm tất cả vào lịch
            </button>
          )}
          {selectedIndex >= 0 && (
            <button
              onClick={() => onSelectBooking(bookings[selectedIndex])}
              className="bg-[#FF5A5F] text-white py-2 px-6 rounded-lg hover:bg-opacity-90 transition-all duration-200"
            >
              Tiếp tục với lịch đã chọn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
