'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { PaymentSettings, getAllPaymentSettings, savePaymentSettings, getDefaultPaymentSettings } from '../lib/db';

interface PaymentManagerProps {
  onSelectPayment?: (payment: PaymentSettings) => void;
}

export default function PaymentManager({ onSelectPayment }: PaymentManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentSettings[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentSettings | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<PaymentSettings>({
    id: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    branch: '',
    isDefault: false,
    createdAt: '',
    updatedAt: ''
  });

  // Tải danh sách thanh toán khi component được tải
  useEffect(() => {
    loadPayments();
  }, []);

  // Tải danh sách thanh toán
  const loadPayments = () => {
    const allPayments = getAllPaymentSettings();
    setPayments(allPayments);
    
    // Nếu có thanh toán mặc định, chọn nó
    const defaultPayment = getDefaultPaymentSettings();
    if (defaultPayment) {
      setSelectedPayment(defaultPayment);
    }
  };

  // Mở modal
  const openModal = () => {
    loadPayments();
    setIsOpen(true);
  };

  // Đóng modal
  const closeModal = () => {
    setIsOpen(false);
    setEditMode(false);
  };

  // Chọn thanh toán
  const handleSelectPayment = (payment: PaymentSettings) => {
    setSelectedPayment(payment);
    if (onSelectPayment) {
      onSelectPayment(payment);
    }
    closeModal();
  };

  // Thêm thanh toán mới
  const handleAddPayment = () => {
    setCurrentPayment({
      id: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
      branch: '',
      isDefault: payments.length === 0, // Mặc định nếu là thanh toán đầu tiên
      createdAt: '',
      updatedAt: ''
    });
    setEditMode(true);
  };

  // Chỉnh sửa thanh toán
  const handleEditPayment = (payment: PaymentSettings) => {
    setCurrentPayment({ ...payment });
    setEditMode(true);
  };

  // Lưu thanh toán
  const handleSavePayment = () => {
    if (!currentPayment.bankName || !currentPayment.accountNumber || !currentPayment.accountName) {
      alert('Vui lòng nhập đầy đủ thông tin ngân hàng, số tài khoản và tên chủ tài khoản');
      return;
    }

    const savedPayment = savePaymentSettings(currentPayment);
    loadPayments();
    setEditMode(false);
  };

  // Xóa thanh toán
  const handleDeletePayment = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thông tin thanh toán này không?')) {
      const updatedPayments = payments.filter(p => p.id !== id);
      localStorage.setItem('paymentSettings', JSON.stringify(updatedPayments));
      loadPayments();
    }
  };

  // Đặt làm mặc định
  const handleSetDefault = (id: string) => {
    const updatedPayments = payments.map(p => ({
      ...p,
      isDefault: p.id === id
    }));
    localStorage.setItem('paymentSettings', JSON.stringify(updatedPayments));
    loadPayments();
  };

  // Danh sách ngân hàng Việt Nam
  const vietnameseBanks = [
    { code: '', name: 'Chọn ngân hàng' },
    { code: 'VIETCOMBANK', name: 'Vietcombank - Ngân hàng TMCP Ngoại thương' },
    { code: 'VIETINBANK', name: 'VietinBank - Ngân hàng TMCP Công thương' },
    { code: 'BIDV', name: 'BIDV - Ngân hàng TMCP Đầu tư và Phát triển' },
    { code: 'AGRIBANK', name: 'Agribank - Ngân hàng Nông nghiệp và Phát triển Nông thôn' },
    { code: 'TECHCOMBANK', name: 'Techcombank - Ngân hàng TMCP Kỹ thương' },
    { code: 'ACB', name: 'ACB - Ngân hàng TMCP Á Châu' },
    { code: 'VPBANK', name: 'VPBank - Ngân hàng TMCP Việt Nam Thịnh Vượng' },
    { code: 'MBBANK', name: 'MB Bank - Ngân hàng TMCP Quân đội' },
    { code: 'SACOMBANK', name: 'Sacombank - Ngân hàng TMCP Sài Gòn Thương Tín' },
    { code: 'TPBANK', name: 'TPBank - Ngân hàng TMCP Tiên Phong' },
    { code: 'HDBANK', name: 'HDBank - Ngân hàng TMCP Phát triển TP.HCM' },
    { code: 'OCEANBANK', name: 'OceanBank - Ngân hàng TMCP Đại Dương' },
    { code: 'EXIMBANK', name: 'Eximbank - Ngân hàng TMCP Xuất Nhập khẩu' },
    { code: 'SHB', name: 'SHB - Ngân hàng TMCP Sài Gòn - Hà Nội' },
    { code: 'DONGABANK', name: 'DongABank - Ngân hàng TMCP Đông Á' },
    { code: 'ABBANK', name: 'ABBank - Ngân hàng TMCP An Bình' },
    { code: 'SEABANK', name: 'SeABank - Ngân hàng TMCP Đông Nam Á' },
    { code: 'VIETABANK', name: 'VietABank - Ngân hàng TMCP Việt Á' },
    { code: 'NAMABANK', name: 'NamABank - Ngân hàng TMCP Nam Á' },
    { code: 'PVCOMBANK', name: 'PVcomBank - Ngân hàng TMCP Đại chúng' },
    { code: 'KIENLONGBANK', name: 'KienlongBank - Ngân hàng TMCP Kiên Long' },
    { code: 'VIETBANK', name: 'VietBank - Ngân hàng TMCP Việt Nam Thương Tín' },
    { code: 'BAOVIETBANK', name: 'BaoVietBank - Ngân hàng TMCP Bảo Việt' },
    { code: 'MOMO', name: 'Ví điện tử MoMo' },
    { code: 'ZALOPAY', name: 'Ví điện tử ZaloPay' },
    { code: 'VNPAY', name: 'Ví điện tử VNPay' },
    { code: 'OTHER', name: 'Ngân hàng khác' }
  ];

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Thanh toán
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
                    {editMode ? 'Chỉnh sửa thông tin thanh toán' : 'Quản lý thông tin thanh toán'}
                  </Dialog.Title>

                  {!editMode ? (
                    <>
                      <div className="mb-4">
                        <button
                          type="button"
                          onClick={handleAddPayment}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Thêm mới
                        </button>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {payments.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3">
                            {payments.map((payment) => (
                              <div
                                key={payment.id}
                                className={`border rounded-lg p-4 ${payment.isDefault ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {vietnameseBanks.find(b => b.code === payment.bankName)?.name || payment.bankName}
                                      {payment.isDefault && (
                                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                                          Mặc định
                                        </span>
                                      )}
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">Số TK: {payment.accountNumber}</p>
                                    <p className="text-sm text-gray-600">Chủ TK: {payment.accountName}</p>
                                    {payment.branch && (
                                      <p className="text-sm text-gray-600">Chi nhánh: {payment.branch}</p>
                                    )}
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleSelectPayment(payment)}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleEditPayment(payment)}
                                      className="text-gray-600 hover:text-blue-800"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    {!payment.isDefault && (
                                      <>
                                        <button
                                          onClick={() => handleSetDefault(payment.id)}
                                          className="text-gray-600 hover:text-green-800"
                                          title="Đặt làm mặc định"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => handleDeletePayment(payment.id)}
                                          className="text-gray-600 hover:text-red-800"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <p>Chưa có thông tin thanh toán nào</p>
                            <button
                              onClick={handleAddPayment}
                              className="mt-2 text-sm text-green-600 hover:text-green-800"
                            >
                              Thêm thông tin thanh toán
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                          Ngân hàng
                        </label>
                        <select
                          id="bankName"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={currentPayment.bankName}
                          onChange={(e) => setCurrentPayment({ ...currentPayment, bankName: e.target.value })}
                        >
                          {vietnameseBanks.map((bank) => (
                            <option key={bank.code} value={bank.code}>
                              {bank.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          Số tài khoản
                        </label>
                        <input
                          type="text"
                          id="accountNumber"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={currentPayment.accountNumber}
                          onChange={(e) => setCurrentPayment({ ...currentPayment, accountNumber: e.target.value })}
                          placeholder="Nhập số tài khoản"
                        />
                      </div>

                      <div>
                        <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
                          Tên chủ tài khoản
                        </label>
                        <input
                          type="text"
                          id="accountName"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={currentPayment.accountName}
                          onChange={(e) => setCurrentPayment({ ...currentPayment, accountName: e.target.value })}
                          placeholder="Nhập tên chủ tài khoản"
                        />
                      </div>

                      <div>
                        <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
                          Chi nhánh (không bắt buộc)
                        </label>
                        <input
                          type="text"
                          id="branch"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={currentPayment.branch || ''}
                          onChange={(e) => setCurrentPayment({ ...currentPayment, branch: e.target.value })}
                          placeholder="Nhập chi nhánh ngân hàng"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isDefault"
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          checked={currentPayment.isDefault}
                          onChange={(e) => setCurrentPayment({ ...currentPayment, isDefault: e.target.checked })}
                        />
                        <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                          Đặt làm mặc định
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none"
                      onClick={editMode ? () => setEditMode(false) : closeModal}
                    >
                      {editMode ? 'Hủy' : 'Đóng'}
                    </button>
                    {editMode && (
                      <button
                        type="button"
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none"
                        onClick={handleSavePayment}
                      >
                        Lưu
                      </button>
                    )}
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
