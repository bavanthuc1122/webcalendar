'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { CustomerData, getAllCustomers, getBookingsByCustomer } from '../lib/db';

interface CustomerManagerProps {
  onSelectCustomer?: (customer: CustomerData) => void;
}

export default function CustomerManager({ onSelectCustomer }: CustomerManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'recent'>('recent');

  // Tải danh sách khách hàng khi component được tải
  useEffect(() => {
    loadCustomers();
  }, []);

  // Tải danh sách khách hàng
  const loadCustomers = () => {
    const allCustomers = getAllCustomers();
    setCustomers(allCustomers);
  };

  // Mở modal
  const openModal = () => {
    loadCustomers();
    setIsOpen(true);
  };

  // Đóng modal
  const closeModal = () => {
    setIsOpen(false);
    setSelectedCustomer(null);
    setSearchTerm('');
  };

  // Chọn khách hàng
  const handleSelectCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    if (onSelectCustomer) {
      onSelectCustomer(customer);
    }
    closeModal();
  };

  // Lọc và sắp xếp khách hàng
  const filteredCustomers = customers
    .filter(customer => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.phone.includes(searchTerm)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        // Sắp xếp theo thời gian cập nhật gần nhất
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Khách hàng
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    Quản lý khách hàng
                  </Dialog.Title>

                  <div className="mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Tìm kiếm theo tên hoặc số điện thoại"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <select
                        className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'name' | 'recent')}
                      >
                        <option value="recent">Gần đây nhất</option>
                        <option value="name">Theo tên</option>
                      </select>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {filteredCustomers.map((customer) => {
                          const bookings = getBookingsByCustomer(customer.id);
                          const lastBooking = bookings.length > 0 
                            ? bookings.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
                            : null;
                          
                          return (
                            <div
                              key={customer.id}
                              className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                              onClick={() => handleSelectCustomer(customer)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-gray-900">{customer.name}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{customer.phone}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs text-gray-500">
                                    {bookings.length} lịch đặt
                                  </span>
                                  {lastBooking && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Gần nhất: {new Date(lastBooking.date).toLocaleDateString('vi-VN')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {customer.notes && (
                                <p className="text-xs text-gray-600 mt-2 italic">
                                  Ghi chú: {customer.notes}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        {searchTerm ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có khách hàng nào'}
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
