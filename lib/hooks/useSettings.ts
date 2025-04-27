import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

export interface SettingData {
  id?: string;
  _id?: string;
  type: 'invoice' | 'email' | 'payment' | 'general';
  data: any;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentSettingData {
  id?: string;
  _id?: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
  qrCodeUrl?: string;
  isDefault: boolean;
}

export const useSettings = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Lấy tất cả settings theo loại
  const getSettingsByType = (type: 'invoice' | 'email' | 'payment' | 'general') => {
    return useQuery<SettingData[]>(
      ['settings', type],
      async () => {
        try {
          const response = await fetch(`/api/settings?type=${type}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Lỗi khi lấy settings loại ${type}`);
          }
          return response.json();
        } catch (error) {
          setError(error.message);
          throw error;
        }
      },
      {
        staleTime: 60000, // 1 phút
        refetchOnWindowFocus: false,
      }
    );
  };

  // Lấy setting mặc định theo loại
  const getDefaultSetting = async (type: 'invoice' | 'email' | 'payment' | 'general'): Promise<SettingData | null> => {
    try {
      const response = await fetch(`/api/settings?type=${type}&isDefault=true`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Lỗi khi lấy setting mặc định loại ${type}`);
      }
      const settings = await response.json();
      return settings.length > 0 ? settings[0] : null;
    } catch (error) {
      setError(error.message);
      return null;
    }
  };

  // Lấy setting theo ID
  const getSettingById = async (id: string): Promise<SettingData | null> => {
    try {
      const response = await fetch(`/api/settings/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Lỗi khi lấy setting với ID ${id}`);
      }
      return response.json();
    } catch (error) {
      setError(error.message);
      return null;
    }
  };

  // Tạo setting mới
  const createSettingMutation = useMutation(
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
        throw new Error(errorData.error || 'Lỗi khi tạo setting');
      }

      return response.json();
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['settings', data.type]);
      },
      onError: (error: Error) => {
        setError(error.message);
      },
    }
  );

  // Cập nhật setting
  const updateSettingMutation = useMutation(
    async (setting: SettingData) => {
      const id = setting._id || setting.id;
      if (!id) throw new Error('Setting ID không được cung cấp');

      const response = await fetch(`/api/settings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setting),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Lỗi khi cập nhật setting với ID ${id}`);
      }

      return response.json();
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['settings', data.type]);
      },
      onError: (error: Error) => {
        setError(error.message);
      },
    }
  );

  // Lấy tất cả cài đặt thanh toán
  const { data: paymentSettings, isLoading: isLoadingPaymentSettings } = useQuery<SettingData[]>(
    'paymentSettings',
    async () => {
      try {
        const response = await fetch('/api/settings?type=payment');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Lỗi khi lấy cài đặt thanh toán');
        }
        return response.json();
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },
    {
      staleTime: 60000, // 1 phút
      refetchOnWindowFocus: false,
    }
  );

  // Lưu cài đặt thanh toán
  const savePaymentSettingMutation = useMutation(
    async (paymentSetting: PaymentSettingData) => {
      const setting: SettingData = {
        type: 'payment',
        data: paymentSetting,
        isDefault: paymentSetting.isDefault,
      };

      if (paymentSetting.id || paymentSetting._id) {
        setting.id = paymentSetting.id || paymentSetting._id;
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setting),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi khi lưu cài đặt thanh toán');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('paymentSettings');
        queryClient.invalidateQueries(['settings', 'payment']);
      },
      onError: (error: Error) => {
        setError(error.message);
      },
    }
  );

  return {
    getSettingsByType,
    getDefaultSetting,
    getSettingById,
    createSetting: createSettingMutation.mutateAsync,
    updateSetting: updateSettingMutation.mutateAsync,
    paymentSettings,
    isLoadingPaymentSettings,
    savePaymentSetting: savePaymentSettingMutation.mutateAsync,
    isSavingPaymentSetting: savePaymentSettingMutation.isLoading,
    error,
  };
};
