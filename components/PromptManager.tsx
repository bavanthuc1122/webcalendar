'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// Định nghĩa cấu trúc của một prompt
export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  isDefault?: boolean;
  category?: string;
}

// Các prompt mẫu mặc định
export const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: 'default-photography',
    name: 'Chụp ảnh cơ bản',
    content: `Phân tích thông tin đặt lịch sau và trả về dưới dạng JSON hợp lệ:
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

Chỉ trả về JSON, không thêm bất kỳ văn bản nào khác.`,
    isDefault: true,
    category: 'photography'
  },
  {
    id: 'wedding-photography',
    name: 'Chụp ảnh cưới',
    content: `Phân tích thông tin đặt lịch chụp ảnh cưới sau và trả về dưới dạng JSON hợp lệ:
{{input}}

Trả về JSON với các trường:
- customer: tên cô dâu và chú rể (chỉ lấy tên người, không bao gồm các thông tin khác)
- time: giờ bắt đầu chụp (định dạng HH:MM, ví dụ: 10:00, 14:30)
- duration: thời lượng chụp tính bằng giờ (mặc định là 4 nếu không có thông tin)
- deposit: tiền đặt cọc (chỉ số, không có đơn vị)
- total: tổng chi phí (chỉ số, không có đơn vị)
- phone: số điện thoại liên hệ
- date: ngày chụp (định dạng DD/MM/YYYY)
- location: địa điểm chụp (nếu có)
- concepts: các ý tưởng chụp (nếu có)
- package: gói chụp ảnh (nếu có)

Quy tắc phân tích:
- Nếu thấy "10h" hoặc tương tự, chuyển thành "10:00"
- Nếu thấy "10h30" hoặc tương tự, chuyển thành "10:30"
- Nếu thấy "950k" hoặc tương tự, chuyển thành 950000 (không có đơn vị)
- Nếu thấy ngày dạng "25.5.2025" hoặc tương tự, chuyển thành "25/05/2025"
- Nếu không có thông tin về thời lượng, mặc định là 4 giờ
- Nếu thấy "cô dâu: [tên]" và "chú rể: [tên]", ghép thành "[tên cô dâu] & [tên chú rể]"

Chỉ trả về JSON, không thêm bất kỳ văn bản nào khác.`,
    isDefault: true,
    category: 'wedding'
  },
  {
    id: 'product-photography',
    name: 'Chụp ảnh sản phẩm',
    content: `Phân tích thông tin đặt lịch chụp ảnh sản phẩm sau và trả về dưới dạng JSON hợp lệ:
{{input}}

Trả về JSON với các trường:
- customer: tên khách hàng hoặc công ty (chỉ lấy tên, không bao gồm các thông tin khác)
- time: giờ bắt đầu chụp (định dạng HH:MM, ví dụ: 10:00, 14:30)
- duration: thời lượng chụp tính bằng giờ (mặc định là 2 nếu không có thông tin)
- deposit: tiền đặt cọc (chỉ số, không có đơn vị)
- total: tổng chi phí (chỉ số, không có đơn vị)
- phone: số điện thoại liên hệ
- date: ngày chụp (định dạng DD/MM/YYYY)
- products: số lượng sản phẩm cần chụp (nếu có)
- concepts: các ý tưởng chụp hoặc yêu cầu đặc biệt (nếu có)

Quy tắc phân tích:
- Nếu thấy "10h" hoặc tương tự, chuyển thành "10:00"
- Nếu thấy "10h30" hoặc tương tự, chuyển thành "10:30"
- Nếu thấy "950k" hoặc tương tự, chuyển thành 950000 (không có đơn vị)
- Nếu thấy ngày dạng "25.5.2025" hoặc tương tự, chuyển thành "25/05/2025"
- Nếu không có thông tin về thời lượng, mặc định là 2 giờ
- Nếu thấy "số lượng sản phẩm: [số]" hoặc tương tự, trích xuất số lượng

Chỉ trả về JSON, không thêm bất kỳ văn bản nào khác.`,
    isDefault: true,
    category: 'product'
  }
];

interface PromptManagerProps {
  onSelectPrompt: (prompt: string) => void;
  onSavePrompt: (prompt: PromptTemplate) => void;
}

export default function PromptManager({ onSelectPrompt, onSavePrompt }: PromptManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [newPrompt, setNewPrompt] = useState<PromptTemplate>({
    id: '',
    name: '',
    content: '',
    category: 'custom'
  });

  // Tải các prompt từ localStorage khi component được tải
  useEffect(() => {
    const savedPrompts = localStorage.getItem('promptTemplates');
    if (savedPrompts) {
      try {
        const parsedPrompts = JSON.parse(savedPrompts);
        setPrompts([...DEFAULT_PROMPTS, ...parsedPrompts]);
      } catch (error) {
        console.error('Lỗi khi phân tích prompt đã lưu:', error);
        setPrompts([...DEFAULT_PROMPTS]);
      }
    } else {
      setPrompts([...DEFAULT_PROMPTS]);
    }

    // Tải prompt đã chọn gần đây nhất
    const lastSelectedPromptId = localStorage.getItem('lastSelectedPromptId');
    if (lastSelectedPromptId) {
      setSelectedPromptId(lastSelectedPromptId);
    } else {
      setSelectedPromptId('default-photography');
    }
  }, []);

  // Lưu các prompt vào localStorage khi có thay đổi
  useEffect(() => {
    if (prompts.length > 0) {
      // Chỉ lưu các prompt tùy chỉnh, không lưu prompt mặc định
      const customPrompts = prompts.filter(p => !p.isDefault);
      localStorage.setItem('promptTemplates', JSON.stringify(customPrompts));
    }
  }, [prompts]);

  // Lưu prompt đã chọn gần đây nhất
  useEffect(() => {
    if (selectedPromptId) {
      localStorage.setItem('lastSelectedPromptId', selectedPromptId);
      const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
      if (selectedPrompt) {
        onSelectPrompt(selectedPrompt.content);
      }
    }
  }, [selectedPromptId, prompts, onSelectPrompt]);

  const handleOpenModal = () => {
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setEditMode(false);
    setNewPrompt({
      id: '',
      name: '',
      content: '',
      category: 'custom'
    });
  };

  const handleSelectPrompt = (id: string) => {
    setSelectedPromptId(id);
    handleCloseModal();
  };

  const handleCreatePrompt = () => {
    setEditMode(true);
    setNewPrompt({
      id: `custom-${Date.now()}`,
      name: '',
      content: '',
      category: 'custom'
    });
  };

  const handleEditPrompt = (prompt: PromptTemplate) => {
    setEditMode(true);
    setNewPrompt({ ...prompt });
  };

  const handleDeletePrompt = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa prompt này không?')) {
      setPrompts(prompts.filter(p => p.id !== id));
      if (selectedPromptId === id) {
        setSelectedPromptId('default-photography');
      }
    }
  };

  const handleSavePrompt = () => {
    if (!newPrompt.name.trim() || !newPrompt.content.trim()) {
      alert('Vui lòng nhập tên và nội dung cho prompt');
      return;
    }

    const updatedPrompts = [...prompts];
    const existingIndex = updatedPrompts.findIndex(p => p.id === newPrompt.id);

    if (existingIndex >= 0) {
      updatedPrompts[existingIndex] = newPrompt;
    } else {
      updatedPrompts.push(newPrompt);
    }

    setPrompts(updatedPrompts);
    onSavePrompt(newPrompt);
    setEditMode(false);
    setSelectedPromptId(newPrompt.id);
    handleCloseModal();
  };

  const getSelectedPromptName = () => {
    const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
    return selectedPrompt ? selectedPrompt.name : 'Chọn prompt';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={handleOpenModal}
          className="flex items-center text-sm text-gray-600 hover:text-[#FF5A5F] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {getSelectedPromptName()}
        </button>
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleCloseModal}>
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
                    {editMode ? 'Chỉnh sửa Prompt' : 'Quản lý Prompt'}
                  </Dialog.Title>

                  {!editMode ? (
                    <>
                      <div className="mb-4 flex justify-between items-center">
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={handleCreatePrompt}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF5A5F] hover:bg-opacity-90 focus:outline-none"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Tạo mới
                          </button>
                          <select
                            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                            onChange={(e) => {
                              const category = e.target.value;
                              if (category === 'all') {
                                // Hiển thị tất cả
                                setPrompts([...DEFAULT_PROMPTS, ...prompts.filter(p => !p.isDefault)]);
                              } else {
                                // Lọc theo danh mục
                                const defaultPromptsInCategory = DEFAULT_PROMPTS.filter(p => p.category === category);
                                const customPromptsInCategory = prompts.filter(p => !p.isDefault && p.category === category);
                                setPrompts([...defaultPromptsInCategory, ...customPromptsInCategory]);
                              }
                            }}
                          >
                            <option value="all">Tất cả danh mục</option>
                            <option value="photography">Chụp ảnh cơ bản</option>
                            <option value="wedding">Chụp ảnh cưới</option>
                            <option value="product">Chụp ảnh sản phẩm</option>
                            <option value="custom">Tùy chỉnh</option>
                          </select>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Prompt mẫu</h4>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                          <p className="text-xs text-gray-600 mb-2">
                            Các prompt mẫu được cung cấp sẵn để bạn có thể sử dụng hoặc tùy chỉnh. Nhấp vào một prompt để sử dụng.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {DEFAULT_PROMPTS.map((prompt) => (
                              <div
                                key={prompt.id}
                                className={`border rounded-lg p-2 cursor-pointer transition-colors ${
                                  selectedPromptId === prompt.id ? 'border-[#FF5A5F] bg-red-50' : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleSelectPrompt(prompt.id)}
                              >
                                <div className="flex items-center">
                                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                  <h5 className="font-medium text-sm text-gray-900">{prompt.name}</h5>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditPrompt({
                                      ...prompt,
                                      id: `custom-${Date.now()}`,
                                      isDefault: false
                                    });
                                  }}
                                  className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Tạo bản sao để chỉnh sửa
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Prompt của bạn</h4>
                        <div className="max-h-60 overflow-y-auto">
                          <div className="grid grid-cols-1 gap-3">
                            {prompts.filter(p => !p.isDefault).length > 0 ? (
                              prompts.filter(p => !p.isDefault).map((prompt) => (
                                <div
                                  key={prompt.id}
                                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                    selectedPromptId === prompt.id ? 'border-[#FF5A5F] bg-red-50' : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => handleSelectPrompt(prompt.id)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium text-gray-900">{prompt.name}</h4>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {prompt.category === 'custom' ? 'Tùy chỉnh' :
                                         prompt.category === 'wedding' ? 'Chụp ảnh cưới' :
                                         prompt.category === 'product' ? 'Chụp ảnh sản phẩm' : 'Chụp ảnh cơ bản'}
                                      </p>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditPrompt(prompt);
                                        }}
                                        className="text-gray-400 hover:text-blue-500"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeletePrompt(prompt.id);
                                        }}
                                        className="text-gray-400 hover:text-red-500"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                      {prompt.content.substring(0, 150)}...
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 text-gray-500">
                                <p>Bạn chưa tạo prompt nào</p>
                                <button
                                  onClick={handleCreatePrompt}
                                  className="mt-2 text-sm text-[#FF5A5F] hover:text-red-700"
                                >
                                  Tạo prompt mới
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="promptName" className="block text-sm font-medium text-gray-700 mb-1">
                          Tên Prompt
                        </label>
                        <input
                          type="text"
                          id="promptName"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                          value={newPrompt.name}
                          onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                          placeholder="Nhập tên cho prompt này"
                        />
                      </div>
                      <div>
                        <label htmlFor="promptCategory" className="block text-sm font-medium text-gray-700 mb-1">
                          Danh mục
                        </label>
                        <select
                          id="promptCategory"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                          value={newPrompt.category}
                          onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                        >
                          <option value="custom">Tùy chỉnh</option>
                          <option value="photography">Chụp ảnh cơ bản</option>
                          <option value="wedding">Chụp ảnh cưới</option>
                          <option value="product">Chụp ảnh sản phẩm</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="promptContent" className="block text-sm font-medium text-gray-700 mb-1">
                          Nội dung Prompt
                        </label>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2">
                          <p className="text-xs text-gray-600">
                            <strong>Hướng dẫn:</strong> Sử dụng <code className="bg-gray-200 px-1 rounded">{{input}}</code> để chèn văn bản đầu vào từ người dùng. Prompt nên bao gồm các hướng dẫn rõ ràng về cách phân tích dữ liệu và định dạng kết quả trả về.
                          </p>
                          <div className="mt-2 text-xs">
                            <p className="font-medium text-gray-700">Ví dụ về cấu trúc prompt tốt:</p>
                            <pre className="bg-white p-2 rounded mt-1 overflow-x-auto text-gray-600 text-xs">
{`Phân tích thông tin đặt lịch sau và trả về dưới dạng JSON hợp lệ:
{{input}}

Trả về JSON với các trường:
- customer: tên khách hàng
- time: giờ bắt đầu (định dạng HH:MM)
- date: ngày chụp (định dạng DD/MM/YYYY)
...

Quy tắc phân tích:
- Nếu thấy "10h" hoặc tương tự, chuyển thành "10:00"
...

Chỉ trả về JSON, không thêm bất kỳ văn bản nào khác.`}
                            </pre>
                          </div>
                        </div>
                        <textarea
                          id="promptContent"
                          className="w-full h-64 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] font-mono text-sm"
                          value={newPrompt.content}
                          onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                          placeholder="Nhập nội dung prompt (sử dụng {{input}} để chèn văn bản đầu vào)"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none"
                      onClick={handleCloseModal}
                    >
                      {editMode ? 'Hủy' : 'Đóng'}
                    </button>
                    {editMode && (
                      <button
                        type="button"
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#FF5A5F] border border-transparent rounded-md hover:bg-opacity-90 focus:outline-none"
                        onClick={handleSavePrompt}
                      >
                        Lưu Prompt
                      </button>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
