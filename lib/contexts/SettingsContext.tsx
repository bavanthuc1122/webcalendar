'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

// Định nghĩa các loại cấu hình
export type SettingType = 'invoice' | 'email' | 'payment' | 'googleSheet' | 'invoiceSettings' | 'general' | 'adminEmail';

// Định nghĩa cấu trúc dữ liệu cấu hình
export interface SettingData {
  _id?: string;
  id?: string;
  type: SettingType;
  data: any;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Định nghĩa cấu trúc dữ liệu context
interface SettingsContextType {
  // Dữ liệu cấu hình
  settings: Record<SettingType, SettingData[]>;
  defaultSettings: Record<SettingType, SettingData | null>;
  
  // Trạng thái
  isLoading: boolean;
  error: string | null;
  lastUpdated: Record<SettingType, Date | null>;
  
  // Phương thức
  getSetting: (type: SettingType, id?: string) => SettingData | null;
  getDefaultSetting: (type: SettingType) => SettingData | null;
  saveSetting: (setting: SettingData) => Promise<SettingData>;
  deleteSetting: (id: string) => Promise<void>;
  resetToDefault: (type: SettingType) => Promise<void>;
  exportSettings: () => string;
  importSettings: (jsonData: string) => Promise<void>;
  refreshSettings: (type?: SettingType) => Promise<void>;
}

// Tạo context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Record<SettingType, Date | null>>({
    invoice: null,
    email: null,
    payment: null,
    googleSheet: null,
    invoiceSettings: null,
    general: null,
    adminEmail: null
  });

  // Lấy tất cả cấu hình
  const { data: allSettings, isLoading, refetch } = useQuery<SettingData[]>(
    'settings',
    async () => {
      try {
        // Kiểm tra xem có dữ liệu trong localStorage không
        const cachedData = localStorage.getItem('allSettings');
        const cachedTimestamp = localStorage.getItem('allSettingsTimestamp');
        
        // Nếu có dữ liệu trong cache và chưa quá 5 phút, sử dụng dữ liệu từ cache
        if (cachedData && cachedTimestamp) {
          const timestamp = new Date(cachedTimestamp);
          const now = new Date();
          const diffMinutes = (now.getTime() - timestamp.getTime()) / (1000 * 60);
          
          if (diffMinutes < 5) {
            return JSON.parse(cachedData);
          }
        }
        
        // Nếu không có dữ liệu trong cache hoặc đã quá 5 phút, gọi API
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Lỗi khi lấy cấu hình');
        }
        
        const data = await response.json();
        
        // Lưu dữ liệu vào localStorage
        localStorage.setItem('allSettings', JSON.stringify(data));
        localStorage.setItem('allSettingsTimestamp', new Date().toISOString());
        
        return data;
      } catch (error) {
        console.error('Lỗi khi lấy cấu hình:', error);
        setError('Lỗi khi lấy cấu hình. Đang sử dụng dữ liệu từ cache.');
        
        // Nếu có lỗi, sử dụng dữ liệu từ localStorage nếu có
        const cachedData = localStorage.getItem('allSettings');
        if (cachedData) {
          return JSON.parse(cachedData);
        }
        
        return [];
      }
    },
    {
      staleTime: 300000, // 5 phút
      cacheTime: 3600000, // 1 giờ
      refetchOnWindowFocus: false,
    }
  );

  // Mutation để lưu cấu hình
  const saveMutation = useMutation(
    async (setting: SettingData) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setting),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi khi lưu cấu hình');
      }

      return response.json();
    },
    {
      onSuccess: (data) => {
        // Cập nhật cache
        queryClient.invalidateQueries('settings');
        
        // Cập nhật thời gian cập nhật
        setLastUpdated(prev => ({
          ...prev,
          [data.type]: new Date()
        }));
        
        // Lưu dữ liệu vào localStorage để fallback
        const settingKey = `${data.type}Config`;
        localStorage.setItem(settingKey, JSON.stringify(data.data));
      },
      onError: (error: Error) => {
        setError(error.message);
      },
    }
  );

  // Mutation để xóa cấu hình
  const deleteMutation = useMutation(
    async (id: string) => {
      const response = await fetch(`/api/settings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi khi xóa cấu hình');
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('settings');
      },
      onError: (error: Error) => {
        setError(error.message);
      },
    }
  );

  // Tổ chức cấu hình theo loại
  const settings: Record<SettingType, SettingData[]> = {
    invoice: [],
    email: [],
    payment: [],
    googleSheet: [],
    invoiceSettings: [],
    general: [],
    adminEmail: []
  };

  const defaultSettings: Record<SettingType, SettingData | null> = {
    invoice: null,
    email: null,
    payment: null,
    googleSheet: null,
    invoiceSettings: null,
    general: null,
    adminEmail: null
  };

  // Phân loại cấu hình
  if (allSettings) {
    allSettings.forEach(setting => {
      if (setting.type in settings) {
        settings[setting.type as SettingType].push(setting);
        
        if (setting.isDefault) {
          defaultSettings[setting.type as SettingType] = setting;
        }
      }
    });
  }

  // Lấy cấu hình theo loại và ID
  const getSetting = (type: SettingType, id?: string): SettingData | null => {
    if (!id) {
      return getDefaultSetting(type);
    }
    
    return settings[type]?.find(s => s._id === id || s.id === id) || null;
  };

  // Lấy cấu hình mặc định theo loại
  const getDefaultSetting = (type: SettingType): SettingData | null => {
    return defaultSettings[type] || settings[type]?.[0] || null;
  };

  // Lưu cấu hình
  const saveSetting = async (setting: SettingData): Promise<SettingData> => {
    try {
      return await saveMutation.mutateAsync(setting);
    } catch (error) {
      // Fallback: Lưu vào localStorage
      const settingKey = `${setting.type}Config`;
      localStorage.setItem(settingKey, JSON.stringify(setting.data));
      
      // Cập nhật thời gian cập nhật
      setLastUpdated(prev => ({
        ...prev,
        [setting.type]: new Date()
      }));
      
      // Tạo ID giả nếu chưa có
      if (!setting._id && !setting.id) {
        setting.id = `local-${Date.now()}`;
      }
      
      throw error;
    }
  };

  // Xóa cấu hình
  const deleteSetting = async (id: string): Promise<void> => {
    await deleteMutation.mutateAsync(id);
  };

  // Khôi phục cấu hình mặc định
  const resetToDefault = async (type: SettingType): Promise<void> => {
    // Lấy cấu hình mặc định từ server
    try {
      const response = await fetch(`/api/settings/default?type=${type}`);
      if (!response.ok) {
        throw new Error('Lỗi khi lấy cấu hình mặc định');
      }
      
      const defaultSetting = await response.json();
      
      // Lưu cấu hình mặc định
      await saveSetting({
        type,
        data: defaultSetting.data,
        isDefault: true
      });
    } catch (error) {
      console.error('Lỗi khi khôi phục cấu hình mặc định:', error);
      setError('Lỗi khi khôi phục cấu hình mặc định');
      
      // Fallback: Xóa cấu hình trong localStorage
      const settingKey = `${type}Config`;
      localStorage.removeItem(settingKey);
    }
  };

  // Xuất cấu hình
  const exportSettings = (): string => {
    return JSON.stringify(allSettings, null, 2);
  };

  // Nhập cấu hình
  const importSettings = async (jsonData: string): Promise<void> => {
    try {
      const importedSettings = JSON.parse(jsonData);
      
      // Kiểm tra dữ liệu hợp lệ
      if (!Array.isArray(importedSettings)) {
        throw new Error('Dữ liệu không hợp lệ');
      }
      
      // Lưu từng cấu hình
      for (const setting of importedSettings) {
        if (!setting.type || !setting.data) {
          continue;
        }
        
        await saveSetting({
          type: setting.type,
          data: setting.data,
          isDefault: setting.isDefault
        });
      }
      
      // Cập nhật cache
      queryClient.invalidateQueries('settings');
    } catch (error) {
      console.error('Lỗi khi nhập cấu hình:', error);
      setError('Lỗi khi nhập cấu hình');
    }
  };

  // Làm mới cấu hình
  const refreshSettings = async (type?: SettingType): Promise<void> => {
    try {
      if (type) {
        // Xóa cache của loại cấu hình cụ thể
        queryClient.invalidateQueries(['settings', type]);
      } else {
        // Xóa cache của tất cả cấu hình
        queryClient.invalidateQueries('settings');
      }
      
      // Gọi lại API
      await refetch();
    } catch (error) {
      console.error('Lỗi khi làm mới cấu hình:', error);
      setError('Lỗi khi làm mới cấu hình');
    }
  };

  // Giá trị context
  const value: SettingsContextType = {
    settings,
    defaultSettings,
    isLoading,
    error,
    lastUpdated,
    getSetting,
    getDefaultSetting,
    saveSetting,
    deleteSetting,
    resetToDefault,
    exportSettings,
    importSettings,
    refreshSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook để sử dụng context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
