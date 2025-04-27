'use client';

import React, { useState, useEffect } from 'react';
import SettingTooltip from './SettingTooltip';
import SettingBadge from './SettingBadge';

interface SettingFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tooltip?: string;
  type?: string;
  placeholder?: string;
  isSaved?: boolean;
  lastUpdated?: Date | null;
  onBlur?: () => void;
  required?: boolean;
  pattern?: string;
  error?: string;
}

/**
 * Component hiển thị trường cấu hình với tooltip và badge
 */
const SettingField: React.FC<SettingFieldProps> = ({
  label,
  name,
  value,
  onChange,
  tooltip,
  type = 'text',
  placeholder,
  isSaved = false,
  lastUpdated,
  onBlur,
  required = false,
  pattern,
  error,
}) => {
  const [localError, setLocalError] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Kiểm tra validation khi value thay đổi
  useEffect(() => {
    if (!isDirty) return;

    if (required && !value) {
      setLocalError('Trường này là bắt buộc');
    } else if (pattern && value && !new RegExp(pattern).test(value)) {
      setLocalError('Giá trị không hợp lệ');
    } else {
      setLocalError('');
    }
  }, [value, required, pattern, isDirty]);

  const handleBlur = () => {
    setIsDirty(true);
    if (onBlur) onBlur();
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <div>
          {tooltip ? (
            <SettingTooltip content={tooltip}>
              <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
            </SettingTooltip>
          ) : (
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
          )}
        </div>
        <SettingBadge isSaved={isSaved} lastUpdated={lastUpdated} />
      </div>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e);
          if (!isDirty) setIsDirty(true);
        }}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full p-2 border ${
          localError || error ? 'border-red-500' : 'border-gray-300'
        } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
        required={required}
        pattern={pattern}
      />
      {(localError || error) && (
        <p className="mt-1 text-xs text-red-500">{localError || error}</p>
      )}
    </div>
  );
};

export default SettingField;
