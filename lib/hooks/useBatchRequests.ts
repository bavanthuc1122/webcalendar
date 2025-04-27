import { useState, useCallback } from 'react';

interface BatchRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: any;
}

interface BatchResponse {
  status: number;
  data?: any;
  error?: string;
}

interface BatchResult {
  responses: BatchResponse[];
}

/**
 * Hook để xử lý batch requests
 * @returns Các hàm và state để xử lý batch requests
 */
export const useBatchRequests = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Gửi nhiều requests trong một lần gọi API
   * @param requests Mảng các requests cần gửi
   * @returns Kết quả của các requests
   */
  const sendBatchRequests = useCallback(async (requests: BatchRequest[]): Promise<BatchResponse[]> => {
    if (!requests || requests.length === 0) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      // Giới hạn số lượng requests trong một batch (tối đa 10)
      const batchSize = 10;
      const batches = [];

      // Chia nhỏ requests thành các batch
      for (let i = 0; i < requests.length; i += batchSize) {
        batches.push(requests.slice(i, i + batchSize));
      }

      // Gửi từng batch và gộp kết quả
      const allResponses: BatchResponse[] = [];

      for (const batch of batches) {
        const response = await fetch('/api/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests: batch }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Lỗi khi gửi batch requests');
        }

        const result: BatchResult = await response.json();
        allResponses.push(...result.responses);
      }

      return allResponses;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định khi gửi batch requests';
      setError(errorMessage);
      console.error('Lỗi khi gửi batch requests:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Gửi một GET request đến nhiều endpoints và gộp kết quả
   * @param paths Mảng các đường dẫn cần gửi GET request
   * @returns Kết quả của các requests
   */
  const batchGet = useCallback(async (paths: string[]): Promise<any[]> => {
    const requests: BatchRequest[] = paths.map(path => ({
      method: 'GET',
      path,
    }));

    const responses = await sendBatchRequests(requests);
    
    // Lọc các responses thành công và trả về data
    return responses
      .filter(response => response.status >= 200 && response.status < 300)
      .map(response => response.data);
  }, [sendBatchRequests]);

  /**
   * Gửi nhiều POST requests trong một lần gọi API
   * @param requests Mảng các requests với path và body
   * @returns Kết quả của các requests
   */
  const batchPost = useCallback(async (requests: { path: string; body: any }[]): Promise<any[]> => {
    const batchRequests: BatchRequest[] = requests.map(req => ({
      method: 'POST',
      path: req.path,
      body: req.body,
    }));

    const responses = await sendBatchRequests(batchRequests);
    
    // Lọc các responses thành công và trả về data
    return responses
      .filter(response => response.status >= 200 && response.status < 300)
      .map(response => response.data);
  }, [sendBatchRequests]);

  return {
    sendBatchRequests,
    batchGet,
    batchPost,
    isLoading,
    error,
  };
};
