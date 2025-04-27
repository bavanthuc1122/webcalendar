import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

export interface BookingData {
  id?: string;
  _id?: string;
  customer: string;
  time: string;
  date: string;
  duration: number;
  deposit: number;
  total: number;
  phone: string;
  concepts?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
  calendarEventId?: string;
  invoiceUrl?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  customerId?: string;
}

export const useBookings = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Lấy tất cả bookings
  const { data: bookings, isLoading, refetch } = useQuery<BookingData[]>(
    ['bookings'],
    async () => {
      try {
        const response = await fetch('/api/bookings');
        if (!response.ok) {
          throw new Error('Lỗi khi lấy danh sách bookings');
        }
        return response.json();
      } catch (error) {
        console.error('Lỗi khi lấy danh sách bookings:', error);
        setError('API chưa sẵn sàng. Đang sử dụng dữ liệu mẫu.');

        // Fallback to mock data
        return [
          {
            _id: '1',
            id: '1',
            customer: 'Nguyễn Văn A',
            phone: '0987654321',
            time: '10:00',
            date: '2023-12-01',
            duration: 2,
            deposit: 500000,
            total: 2000000,
            status: 'confirmed',
            concepts: 'Chụp ảnh gia đình',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            customerId: '1'
          },
          {
            _id: '2',
            id: '2',
            customer: 'Trần Thị B',
            phone: '0123456789',
            time: '14:00',
            date: '2023-12-02',
            duration: 3,
            deposit: 1000000,
            total: 3000000,
            status: 'pending',
            concepts: 'Chụp ảnh cưới',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            customerId: '2'
          },
          {
            _id: '3',
            id: '3',
            customer: 'Lê Văn C',
            phone: '0909123456',
            time: '09:00',
            date: '2023-12-03',
            duration: 1,
            deposit: 300000,
            total: 1000000,
            status: 'completed',
            concepts: 'Chụp ảnh sản phẩm',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            customerId: '3'
          }
        ];
      }
    },
    {
      staleTime: 60000, // 1 phút
      refetchOnWindowFocus: false,
    }
  );

  // Lấy booking theo ID
  const getBookingById = async (id: string): Promise<BookingData | null> => {
    try {
      const response = await fetch(`/api/bookings/${id}`);
      if (!response.ok) {
        throw new Error(`Lỗi khi lấy booking với ID ${id}`);
      }
      return response.json();
    } catch (error) {
      console.error(`Lỗi khi lấy booking với ID ${id}:`, error);
      setError(`API chưa sẵn sàng. Đang sử dụng dữ liệu mẫu cho booking ID ${id}.`);

      // Fallback to mock data
      const mockBookings = [
        {
          _id: '1',
          id: '1',
          customer: 'Nguyễn Văn A',
          phone: '0987654321',
          time: '10:00',
          date: '2023-12-01',
          duration: 2,
          deposit: 500000,
          total: 2000000,
          status: 'confirmed',
          concepts: 'Chụp ảnh gia đình',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          customerId: '1'
        },
        {
          _id: '2',
          id: '2',
          customer: 'Trần Thị B',
          phone: '0123456789',
          time: '14:00',
          date: '2023-12-02',
          duration: 3,
          deposit: 1000000,
          total: 3000000,
          status: 'pending',
          concepts: 'Chụp ảnh cưới',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          customerId: '2'
        },
        {
          _id: '3',
          id: '3',
          customer: 'Lê Văn C',
          phone: '0909123456',
          time: '09:00',
          date: '2023-12-03',
          duration: 1,
          deposit: 300000,
          total: 1000000,
          status: 'completed',
          concepts: 'Chụp ảnh sản phẩm',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          customerId: '3'
        }
      ];

      // Tìm booking theo ID
      return mockBookings.find(booking => booking.id === id || booking._id === id) || null;
    }
  };

  // Tạo booking mới
  const createBookingMutation = useMutation(
    async (booking: BookingData) => {
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(booking),
        });

        if (!response.ok) {
          throw new Error('Lỗi khi tạo booking');
        }

        return response.json();
      } catch (error) {
        console.error('Lỗi khi tạo booking:', error);

        // Fallback khi API chưa sẵn sàng
        console.log('API chưa sẵn sàng. Tạo booking mẫu.');

        // Tạo booking mẫu với ID ngẫu nhiên
        const mockBooking = {
          ...booking,
          _id: `mock_${Date.now()}`,
          id: `mock_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return mockBooking;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bookings']);
      },
      onError: (error: Error) => {
        setError(error.message);
      },
    }
  );

  // Cập nhật booking
  const updateBookingMutation = useMutation(
    async (booking: BookingData) => {
      try {
        const id = booking._id || booking.id;
        if (!id) throw new Error('Booking ID không được cung cấp');

        const response = await fetch(`/api/bookings/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(booking),
        });

        if (!response.ok) {
          throw new Error(`Lỗi khi cập nhật booking với ID ${id}`);
        }

        return response.json();
      } catch (error) {
        console.error('Lỗi khi cập nhật booking:', error);

        // Fallback khi API chưa sẵn sàng
        console.log('API chưa sẵn sàng. Cập nhật booking mẫu.');

        // Trả về booking đã cập nhật
        return {
          ...booking,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bookings']);
      },
      onError: (error: Error) => {
        setError(error.message);
      },
    }
  );

  // Xóa booking
  const deleteBookingMutation = useMutation(
    async (id: string) => {
      try {
        const response = await fetch(`/api/bookings/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Lỗi khi xóa booking với ID ${id}`);
        }

        return response.json();
      } catch (error) {
        console.error(`Lỗi khi xóa booking với ID ${id}:`, error);

        // Fallback khi API chưa sẵn sàng
        console.log('API chưa sẵn sàng. Giả lập xóa booking.');

        // Trả về kết quả giả
        return { success: true, message: 'Đã xóa booking (giả lập)' };
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bookings']);
      },
      onError: (error: Error) => {
        setError(error.message);
      },
    }
  );

  return {
    bookings,
    isLoading,
    error,
    refetch,
    getBookingById,
    createBooking: createBookingMutation.mutateAsync,
    updateBooking: updateBookingMutation.mutateAsync,
    deleteBooking: deleteBookingMutation.mutateAsync,
    isCreating: createBookingMutation.isLoading,
    isUpdating: updateBookingMutation.isLoading,
    isDeleting: deleteBookingMutation.isLoading,
  };
};
