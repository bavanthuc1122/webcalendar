import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

interface SettingHistoryData {
  _id: string;
  settingId: string;
  type: string;
  data: any;
  changedBy?: string;
  changeType: 'create' | 'update' | 'delete' | 'restore';
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface HistoryResponse {
  history: SettingHistoryData[];
  pagination: PaginationData;
}

export const useSettingsHistory = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Lấy lịch sử cấu hình theo loại
  const getHistoryByType = (type: string, page = 1, limit = 10) => {
    return useQuery<HistoryResponse>(
      ['settingsHistory', type, page, limit],
      async () => {
        try {
          const response = await fetch(`/api/settings/history?type=${type}&page=${page}&limit=${limit}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Lỗi khi lấy lịch sử cấu hình loại ${type}`);
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

  // Lấy lịch sử cấu hình theo ID cấu hình
  const getHistoryBySettingId = (settingId: string, page = 1, limit = 10) => {
    return useQuery<HistoryResponse>(
      ['settingsHistory', settingId, page, limit],
      async () => {
        try {
          const response = await fetch(`/api/settings/history?settingId=${settingId}&page=${page}&limit=${limit}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Lỗi khi lấy lịch sử cấu hình ID ${settingId}`);
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

  // Khôi phục cấu hình từ lịch sử
  const restoreMutation = useMutation(
    async ({ historyId, userId }: { historyId: string; userId?: string }) => {
      const response = await fetch('/api/settings/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ historyId, userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi khi khôi phục cấu hình');
      }

      return response.json();
    },
    {
      onSuccess: (data) => {
        // Cập nhật cache cho cấu hình và lịch sử
        queryClient.invalidateQueries('settings');
        queryClient.invalidateQueries('settingsHistory');
      },
      onError: (error: Error) => {
        setError(error.message);
      },
    }
  );

  return {
    getHistoryByType,
    getHistoryBySettingId,
    restoreMutation,
    error,
  };
};
