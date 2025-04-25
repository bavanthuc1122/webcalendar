'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { BookingData, getAllBookings, deleteBooking } from '../lib/db';

interface BookingManagerProps {
  onSelectBooking?: (booking: BookingData) => void;
}

export default function BookingManager({ onSelectBooking }: BookingManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'customer' | 'status'>('date');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Tải danh sách đặt lịch khi component được tải
  useEffect(() => {
    loadBookings();
  }, []);

  // Tải danh sách đặt lịch
  const loadBookings = () => {
    const allBookings = getAllBookings();
    setBookings(allBookings);
  };

  // Mở modal
  const openModal = () => {
    loadBookings();
    setIsOpen(true);
  };

  // Đóng modal
  const closeModal = () => {
    setIsOpen(false);
    setSelectedBooking(null);
    setSearchTerm('');
    setConfirmDelete(null);
  };

  // Chọn đặt lịch
  const handleSelectBooking = (booking: BookingData) => {
    setSelectedBooking(booking);
    if (onSelectBooking) {
      onSelectBooking(booking);
    }
    closeModal();
  };

  // Xóa đặt lịch
  const handleDeleteBooking = (id: string) => {
    if (confirmDelete === id) {
      const success = deleteBooking(id);
      if (success) {
        loadBookings();
        setConfirmDelete(null);
      }
    } else {
      setConfirmDelete(id);
    }
  };

  // Lọc và sắp xếp đặt lịch
  const filteredBookings = bookings
    .filter(booking => {
      // Lọc theo trạng thái
      if (filterStatus !== 'all' && booking.status !== filterStatus) {
        return false;
      }
      
      // Lọc theo từ khóa tìm kiếm
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        booking.customer.toLowerCase().includes(searchLower) ||
        booking.phone.includes(searchTerm) ||
        (booking.concepts && booking.concepts.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        // Sắp xếp theo ngày
        const dateA = new Date(`${a.date.split('/').reverse().join('-')}T${a.time}`);
        const dateB = new Date(`${b.date.split('/').reverse().join('-')}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
      } else if (sortBy === 'customer') {
        // Sắp xếp theo tên khách hàng
        return a.customer.localeCompare(b.customer);
      } else {
        // Sắp xếp theo trạng thái
        return a.status.localeCompare(b.status);
      }
    });

  // Định dạng trạng thái
  const formatStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Chờ xác nhận</span>;
      case 'confirmed':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Đã xác nhận</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Hoàn thành</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Đã hủy</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Lịch đặt
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
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    Quản lý lịch đặt
                  </Dialog.Title>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc số điện thoại"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="pending">Chờ xác nhận</option>
                      <option value="confirmed">Đã xác nhận</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                    <select
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'date' | 'customer' | 'status')}
                    >
                      <option value="date">Sắp xếp theo ngày</option>
                      <option value="customer">Sắp xếp theo tên</option>
                      <option value="status">Sắp xếp theo trạng thái</option>
                    </select>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {filteredBookings.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Khách hàng
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ngày & Giờ
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trạng thái
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Thanh toán
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredBookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{booking.customer}</div>
                                <div className="text-sm text-gray-500">{booking.phone}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{booking.date}</div>
                                <div className="text-sm text-gray-500">{booking.time} ({booking.duration} giờ)</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {formatStatus(booking.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{booking.total.toLocaleString('vi-VN')}đ</div>
                                <div className="text-sm text-gray-500">
                                  Đã cọc: {booking.deposit.toLocaleString('vi-VN')}đ
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleSelectBooking(booking)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                                >
                                  Chọn
                                </button>
                                <button
                                  onClick={() => handleDeleteBooking(booking.id)}
                                  className={`${
                                    confirmDelete === booking.id
                                      ? 'text-red-600 font-bold'
                                      : 'text-gray-600 hover:text-red-900'
                                  }`}
                                >
                                  {confirmDelete === booking.id ? 'Xác nhận xóa?' : 'Xóa'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        {searchTerm || filterStatus !== 'all'
                          ? 'Không tìm thấy lịch đặt phù hợp'
                          : 'Chưa có lịch đặt nào'}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none"
                      onClick={closeModal}
                    >
                      Đóng
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
