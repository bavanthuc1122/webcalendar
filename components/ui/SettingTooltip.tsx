'use client';

import React, { useState } from 'react';

interface SettingTooltipProps {
  content: string;
  children: React.ReactNode;
}

/**
 * Component hiển thị tooltip giải thích cho các trường cấu hình
 */
const SettingTooltip: React.FC<SettingTooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        className="inline-flex items-center"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 ml-1 text-gray-400 cursor-help"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      {isVisible && (
        <div className="absolute z-10 w-64 p-2 mt-2 text-sm text-white bg-gray-800 rounded-md shadow-lg">
          {content}
        </div>
      )}
    </div>
  );
};

export default SettingTooltip;
