'use client';

import React from 'react';

interface SettingBadgeProps {
  isSaved: boolean;
  lastUpdated?: Date | null;
}

/**
 * Component hiển thị badge "Đã lưu" và thời gian cập nhật
 */
const SettingBadge: React.FC<SettingBadgeProps> = ({ isSaved, lastUpdated }) => {
  if (!isSaved) return null;

  // Format thời gian cập nhật
  const formattedTime = lastUpdated 
    ? new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(lastUpdated)
    : null;

  return (
    <div className="flex items-center space-x-2">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Đã lưu
      </span>
      {formattedTime && (
        <span className="text-xs text-gray-500">
          Cập nhật: {formattedTime}
        </span>
      )}
    </div>
  );
};

export default SettingBadge;
