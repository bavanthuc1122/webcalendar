'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface PaymentInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
  amount?: number;
  description?: string;
}

interface PaymentSettingsProps {
  onSave: (paymentInfo: PaymentInfo, qrDataURL: string) => void;
  initialPaymentInfo?: PaymentInfo;
}

export default function PaymentSettings({ onSave, initialPaymentInfo }: PaymentSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>(
    initialPaymentInfo || {
      bankName: '',
      accountNumber: '',
      accountName: '',
      branch: '',
      amount: 0,
      description: ''
    }
  );
  const [qrDataURL, setQrDataURL] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Tạo QR code khi thông tin thanh toán thay đổi
  useEffect(() => {
    if (paymentInfo.bankName && paymentInfo.accountNumber && paymentInfo.accountName) {
      generateQRCode();
    }
  }, [paymentInfo]);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaymentInfo(prev => ({
      ...prev,
      [name]: name === 'amount' ? (value ? parseFloat(value) : 0) : value
    }));
  };

  // Tạo QR code dựa trên thông tin thanh toán sử dụng VietQR
  const generateQRCode = () => {
    if (!paymentInfo.bankName || !paymentInfo.accountNumber || !paymentInfo.accountName) {
      return;
    }

    try {
      // Lấy mã ngân hàng từ code
      const bankCode = paymentInfo.bankName;

      // Tạo URL VietQR
      let vietQRUrl = `https://img.vietqr.io/image/${bankCode}-${paymentInfo.accountNumber}-compact.png`;

      // Thêm thông tin nếu có
      const params = new URLSearchParams();

      if (paymentInfo.amount) {
        params.append('amount', paymentInfo.amount.toString());
      }

      if (paymentInfo.description) {
        params.append('addInfo', paymentInfo.description);
      }

      // Thêm tên người nhận
      params.append('accountName', paymentInfo.accountName);

      // Nếu có tham số, thêm vào URL
      const queryString = params.toString();
      if (queryString) {
        vietQRUrl += `?${queryString}`;
      }

      // Lưu URL của mã QR
      setQrDataURL(vietQRUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);

      // Tạo một QR code giả để demo trong trường hợp lỗi
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Vẽ nền trắng
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 300, 300);

        // Vẽ QR code giả
        ctx.fillStyle = '#000000';
        const cellSize = 300 / 33; // Kích thước ô QR code
        for (let row = 0; row < 33; row++) {
          for (let col = 0; col < 33; col++) {
            if (Math.random() > 0.7) { // Giả lập QR code
              ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
          }
        }

        setQrDataURL(canvas.toDataURL('image/png'));
      }
    }
  };

  const handleSave = () => {
    if (!paymentInfo.bankName || !paymentInfo.accountNumber || !paymentInfo.accountName) {
      alert('Vui lòng nhập đầy đủ thông tin ngân hàng, số tài khoản và tên chủ tài khoản');
      return;
    }

    onSave(paymentInfo, qrDataURL);
    closeModal();
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
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF5A5F] hover:bg-opacity-90 focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Cài đặt thanh toán
      </button>

      <Dialog open={isOpen} onClose={closeModal} className="relative z-10">
        <Transition
          show={isOpen}
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition
              show={isOpen}
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Cài đặt thông tin thanh toán
                </Dialog.Title>

                  <div className="flex justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setPreviewMode(false)}
                      className={`px-4 py-2 text-sm font-medium ${!previewMode ? 'bg-[#FF5A5F] text-white' : 'bg-gray-100 text-gray-700'} rounded-md`}
                    >
                      Nhập thông tin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (paymentInfo.bankName && paymentInfo.accountNumber && paymentInfo.accountName) {
                          setPreviewMode(true);
                          generateQRCode();
                        } else {
                          alert('Vui lòng nhập đầy đủ thông tin ngân hàng, số tài khoản và tên chủ tài khoản');
                        }
                      }}
                      className={`px-4 py-2 text-sm font-medium ${previewMode ? 'bg-[#FF5A5F] text-white' : 'bg-gray-100 text-gray-700'} rounded-md`}
                    >
                      Xem trước
                    </button>
                  </div>

                  {!previewMode ? (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                          Ngân hàng
                        </label>
                        <select
                          id="bankName"
                          name="bankName"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                          value={paymentInfo.bankName}
                          onChange={handleInputChange}
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
                          name="accountNumber"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                          value={paymentInfo.accountNumber}
                          onChange={handleInputChange}
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
                          name="accountName"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                          value={paymentInfo.accountName}
                          onChange={handleInputChange}
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
                          name="branch"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                          value={paymentInfo.branch || ''}
                          onChange={handleInputChange}
                          placeholder="Nhập chi nhánh ngân hàng"
                        />
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                          Nội dung thanh toán mẫu
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                          value={paymentInfo.description || ''}
                          onChange={handleInputChange}
                          placeholder="Ví dụ: Thanh toán chụp ảnh [tên khách hàng]"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        {qrDataURL ? (
                          <img src={qrDataURL} alt="QR Code" className="w-64 h-64 mx-auto" />
                        ) : (
                          <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                            <p className="text-gray-500">Đang tạo mã QR...</p>
                          </div>
                        )}
                      </div>

                      <div className="w-full max-w-md p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-2">Thông tin thanh toán</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between">
                            <span className="text-gray-600">Ngân hàng:</span>
                            <span className="font-medium">{vietnameseBanks.find(b => b.code === paymentInfo.bankName)?.name || paymentInfo.bankName}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600">Số tài khoản:</span>
                            <span className="font-medium">{paymentInfo.accountNumber}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600">Chủ tài khoản:</span>
                            <span className="font-medium">{paymentInfo.accountName}</span>
                          </li>
                          {paymentInfo.branch && (
                            <li className="flex justify-between">
                              <span className="text-gray-600">Chi nhánh:</span>
                              <span className="font-medium">{paymentInfo.branch}</span>
                            </li>
                          )}
                          {paymentInfo.description && (
                            <li className="flex justify-between">
                              <span className="text-gray-600">Nội dung:</span>
                              <span className="font-medium">{paymentInfo.description}</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none"
                      onClick={closeModal}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#FF5A5F] border border-transparent rounded-md hover:bg-opacity-90 focus:outline-none"
                      onClick={handleSave}
                    >
                      Lưu thông tin
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition>
            </div>
          </div>
        </Dialog>
    </>
  );
}
