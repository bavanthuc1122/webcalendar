'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

interface ParsedData {
  customer: string;
  concepts?: string;
  time: string;
  endTime?: string;
  duration: number;
  deposit: number;
  total: number;
  phone: string;
  date: string;
  endDate?: string;
}

interface ParsedReviewFormProps {
  data: ParsedData;
  onBack?: () => void;
  onSubmit?: (data: ParsedData) => void;
}

export default function ParsedReviewForm({ data, onBack, onSubmit }: ParsedReviewFormProps) {
  // Tính toán giờ kết thúc và ngày kết thúc
  const calculateEndTime = (startTime: string, durationHours: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);

    // Tính toán tổng số phút
    let totalMinutes = hours * 60 + minutes + durationHours * 60;

    // Chuyển đổi lại thành giờ:phút
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;

    // Định dạng lại thành chuỗi "HH:MM"
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  // Chuyển đổi định dạng ngày từ "DD/MM/YYYY" sang "YYYY-MM-DD" cho input type="date"
  const formatDateForInput = (dateStr: string): string => {
    if (!dateStr) return '';

    // Kiểm tra xem dateStr có phải định dạng DD/MM/YYYY không
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return dateStr; // Nếu đã là định dạng YYYY-MM-DD hoặc định dạng khác
  };

  // Thêm giờ kết thúc và ngày kết thúc vào dữ liệu
  const enhancedData = {
    ...data,
    endTime: data.endTime || calculateEndTime(data.time, data.duration),
    date: formatDateForInput(data.date),
    endDate: formatDateForInput(data.endDate || data.date), // Mặc định ngày kết thúc = ngày bắt đầu
  };

  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({
    customer: false,
    concepts: false,
    time: false,
    endTime: false,
    duration: false,
    deposit: false,
    total: false,
    phone: false,
    date: false,
    endDate: false,
  });

  const { control, handleSubmit, watch, setValue } = useForm<ParsedData>({
    defaultValues: enhancedData,
  });

  // Theo dõi các thay đổi để cập nhật giờ kết thúc và thời lượng
  const watchTime = watch('time');
  const watchEndTime = watch('endTime');
  const watchDuration = watch('duration');

  // Cập nhật giờ kết thúc khi giờ bắt đầu hoặc thời lượng thay đổi
  useEffect(() => {
    if (watchTime && watchDuration) {
      const newEndTime = calculateEndTime(watchTime, watchDuration);
      setValue('endTime', newEndTime);
    }
  }, [watchTime, watchDuration, setValue]);

  // Cập nhật thời lượng khi giờ bắt đầu hoặc giờ kết thúc thay đổi
  useEffect(() => {
    if (watchTime && watchEndTime && isEditing.endTime) {
      // Tính toán thời lượng từ giờ bắt đầu và giờ kết thúc
      const [startHours, startMinutes] = watchTime.split(':').map(Number);
      const [endHours, endMinutes] = watchEndTime.split(':').map(Number);

      const startTotalMinutes = startHours * 60 + startMinutes;
      let endTotalMinutes = endHours * 60 + endMinutes;

      // Xử lý trường hợp giờ kết thúc là ngày hôm sau
      if (endTotalMinutes < startTotalMinutes) {
        endTotalMinutes += 24 * 60; // Thêm 24 giờ
      }

      const durationMinutes = endTotalMinutes - startTotalMinutes;
      const durationHours = Math.round(durationMinutes / 60 * 10) / 10; // Làm tròn đến 1 chữ số thập phân

      setValue('duration', durationHours);
    }
  }, [watchTime, watchEndTime, isEditing.endTime, setValue]);

  // Định dạng số tiền
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('vi-VN');
  };

  const handleSubmitForm = (formData: ParsedData) => {
    console.log('Form data:', formData);
    // Gọi callback onSubmit nếu được cung cấp
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const toggleEdit = (field: string) => {
    setIsEditing((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Thông tin đặt lịch</h2>
      <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Thông tin khách hàng */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-700 border-b pb-2">Thông tin khách hàng</h3>

            {/* Tên khách hàng */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-normal" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}>
                {getLabelByKey('customer')}
              </label>
              <div className="flex items-center space-x-2">
                <Controller
                  name="customer"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      disabled={!isEditing.customer}
                      className="w-full p-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => toggleEdit('customer')}
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
                      d={isEditing.customer ? "M5 13l4 4L19 7" : "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"}
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Số điện thoại */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-normal" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}>
                {getLabelByKey('phone')}
              </label>
              <div className="flex items-center space-x-2">
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      disabled={!isEditing.phone}
                      className="w-full p-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => toggleEdit('phone')}
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
                      d={isEditing.phone ? "M5 13l4 4L19 7" : "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"}
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Ý tưởng chụp */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-normal" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}>
                {getLabelByKey('concepts')}
              </label>
              <div className="flex items-center space-x-2">
                <Controller
                  name="concepts"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      disabled={!isEditing.concepts}
                      className="w-full p-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => toggleEdit('concepts')}
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
                      d={isEditing.concepts ? "M5 13l4 4L19 7" : "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"}
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Thông tin lịch hẹn */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-700 border-b pb-2">Thông tin lịch hẹn</h3>

            {/* Ngày chụp */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-normal" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}>
                {getLabelByKey('date')}
              </label>
              <div className="flex items-center space-x-2">
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="date"
                      disabled={!isEditing.date}
                      className="w-full p-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => toggleEdit('date')}
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
                      d={isEditing.date ? "M5 13l4 4L19 7" : "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"}
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Ngày kết thúc */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-normal" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}>
                {getLabelByKey('endDate')}
              </label>
              <div className="flex items-center space-x-2">
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="date"
                      disabled={!isEditing.endDate}
                      className="w-full p-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => toggleEdit('endDate')}
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
                      d={isEditing.endDate ? "M5 13l4 4L19 7" : "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"}
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Giờ bắt đầu và kết thúc */}
            <div className="grid grid-cols-2 gap-4">
              {/* Giờ bắt đầu */}
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-normal" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}>
                  {getLabelByKey('time')}
                </label>
                <div className="flex items-center space-x-2">
                  <Controller
                    name="time"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="time"
                        disabled={!isEditing.time}
                        className="w-full p-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                        step="60"
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => toggleEdit('time')}
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
                        d={isEditing.time ? "M5 13l4 4L19 7" : "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"}
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Giờ kết thúc */}
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-normal" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}>
                  {getLabelByKey('endTime')}
                </label>
                <div className="flex items-center space-x-2">
                  <Controller
                    name="endTime"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="time"
                        disabled={!isEditing.endTime}
                        className="w-full p-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                        step="60"
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => toggleEdit('endTime')}
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
                        d={isEditing.endTime ? "M5 13l4 4L19 7" : "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"}
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Thời lượng */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-normal" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}>
                {getLabelByKey('duration')}
              </label>
              <div className="flex items-center space-x-2">
                <Controller
                  name="duration"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      step="0.1"
                      disabled={!isEditing.duration}
                      className="w-full p-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                      onChange={(e) => {
                        const value = e.target.value === '' ? '' : Number(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => toggleEdit('duration')}
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
                      d={isEditing.duration ? "M5 13l4 4L19 7" : "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"}
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin thanh toán */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-md font-medium text-gray-700 mb-4">Thông tin thanh toán</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tiền đặt cọc */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-normal" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}>
                {getLabelByKey('deposit')}
              </label>
              <div className="flex items-center space-x-2">
                <Controller
                  name="deposit"
                  control={control}
                  render={({ field }) => (
                    <input
                      value={isEditing.deposit ? field.value : formatCurrency(field.value as number)}
                      onChange={(e) => {
                        const value = e.target.value === '' ? '' : Number(e.target.value.replace(/\D/g, ''));
                        field.onChange(value);
                      }}
                      disabled={!isEditing.deposit}
                      className="w-full p-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => toggleEdit('deposit')}
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
                      d={isEditing.deposit ? "M5 13l4 4L19 7" : "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"}
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tổng chi phí */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-normal" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}>
                {getLabelByKey('total')}
              </label>
              <div className="flex items-center space-x-2">
                <Controller
                  name="total"
                  control={control}
                  render={({ field }) => (
                    <input
                      value={isEditing.total ? field.value : formatCurrency(field.value as number)}
                      onChange={(e) => {
                        const value = e.target.value === '' ? '' : Number(e.target.value.replace(/\D/g, ''));
                        field.onChange(value);
                      }}
                      disabled={!isEditing.total}
                      className="w-full p-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => toggleEdit('total')}
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
                      d={isEditing.total ? "M5 13l4 4L19 7" : "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"}
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Số tiền còn lại */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="font-medium">Số tiền còn lại:</span>
              <span className="text-lg font-bold text-[#FF5A5F]">
                {formatCurrency(watch('total') - watch('deposit'))} VNĐ
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between space-x-2 pt-4 border-t border-gray-200">
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
            Lưu và Tiếp tục
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
    endTime: 'Giờ kết thúc',
    duration: 'Thời lượng (giờ)',
    deposit: 'Tiền đặt cọc',
    total: 'Tổng chi phí (VNĐ)',
    phone: 'Số điện thoại',
    date: 'Ngày chụp',
    endDate: 'Ngày kết thúc',
  };
  return labels[key] || key;
}