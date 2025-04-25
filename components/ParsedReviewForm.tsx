'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

interface ParsedData {
  customer: string;
  concepts?: string;
  time: string;
  duration: number;
  deposit: number;
  total: number;
  phone: string;
  date: string;
}

interface ParsedReviewFormProps {
  data: ParsedData;
  onBack?: () => void;
}

export default function ParsedReviewForm({ data, onBack }: ParsedReviewFormProps) {
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({
    customer: false,
    concepts: false,
    time: false,
    duration: false,
    deposit: false,
    total: false,
    phone: false,
    date: false,
  });

  const { control, handleSubmit } = useForm<ParsedData>({
    defaultValues: data,
  });

  const onSubmit = (formData: ParsedData) => {
    console.log('Form data:', formData);
    // Xử lý dữ liệu form ở đây
  };

  const toggleEdit = (field: string) => {
    setIsEditing((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-xl font-semibold mb-4">Thông tin đặt lịch</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex flex-col space-y-1">
            <label className="text-sm font-normal" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}>
              {getLabelByKey(key)}
            </label>
            <div className="flex items-center space-x-2">
              <Controller
                name={key as keyof ParsedData}
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    disabled={!isEditing[key]}
                    className="w-full p-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                    value={field.value}
                    onChange={(e) => {
                      let value = e.target.value;
                      if (key === 'duration' || key === 'deposit' || key === 'total') {
                        field.onChange(value === '' ? '' : Number(value));
                      } else {
                        field.onChange(value);
                      }
                    }}
                  />
                )}
              />
              <button
                type="button"
                onClick={() => toggleEdit(key)}
                className="text-gray-500 hover:text-[#FF5A5F]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isEditing[key] ? "M5 13l4 4L19 7" : "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"}
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
        <div className="flex justify-between space-x-2 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="border border-gray-300 text-gray-700 py-2 px-6 rounded hover:bg-gray-100 transition-all duration-200"
          >
            Quay lại
          </button>
          <button
            type="submit"
            className="bg-[#FF5A5F] text-white py-2 px-6 rounded hover:bg-opacity-90 transition-all duration-200"
          >
            Lưu thông tin
          </button>
        </div>


      </form>
    </div>
  );
}

function getLabelByKey(key: string): string {
  const labels: Record<string, string> = {
    customer: 'Tên khách hàng',
    concepts: 'Ý tưởng chụp',
    time: 'Giờ bắt đầu',
    duration: 'Thời lượng (giờ)',
    deposit: 'Tiền đặt cọc',
    total: 'Tổng chi phí',
    phone: 'Số điện thoại',
    date: 'Ngày chụp',
  };
  return labels[key] || key;
}