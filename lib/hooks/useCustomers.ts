import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

export interface CustomerData {
  id?: string;
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const useCustomers = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Lấy tất cả customers
  const { data: customers, isLoading, refetch } = useQuery<CustomerData[]>(
    ['customers'],
    async () => {
      try {
        const response = await fetch('/api/customers');
        if (!response.ok) {
          throw new Error('Lỗi khi lấy danh sách customers');
        }
        return response.json();
      } catch (error) {
        console.error('Lỗi khi lấy danh sách customers:', error);
        setError('API chưa sẵn sàng. Đang sử dụng dữ liệu mẫu.');

        // Fallback to mock data
        return [
          {
            _id: '1',
            id: '1',
            name: 'Nguyễn Văn A',
            phone: '0987654321',
            email: 'nguyenvana@example.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: '2',
            id: '2',
            name: 'Trần Thị B',
            phone: '0123456789',
            email: 'tranthib@example.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: '3',
            id: '3',
            name: 'Lê Văn C',
            phone: '0909123456',
            email: 'levanc@example.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
      }
    },
    {
      staleTime: 300000, // 5 phút
      refetchOnWindowFocus: false,
      cacheTime: 600000, // 10 phút
    }
  );

  // Tìm kiếm customers với cache
  const searchCustomers = async (searchTerm: string): Promise<CustomerData[]> => {
    // Kiểm tra xem có dữ liệu trong cache không
    const cachedData = queryClient.getQueryData<CustomerData[]>(['customers', 'search', searchTerm]);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await fetch(`/api/customers?search=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        throw new Error('Lỗi khi tìm kiếm customers');
      }
      const data = await response.json();

      // Lưu kết quả vào cache
      queryClient.setQueryData(['customers', 'search', searchTerm], data);

      return data;
    } catch (error) {
      console.error('Lỗi khi tìm kiếm customers:', error);
      setError('API tìm kiếm chưa sẵn sàng. Đang sử dụng dữ liệu mẫu.');

      // Kiểm tra xem có dữ liệu customers trong cache không
      const allCustomers = queryClient.getQueryData<CustomerData[]>(['customers']);
      if (allCustomers) {
        // Lọc dữ liệu từ cache
        const term = searchTerm.toLowerCase();
        const filteredData = allCustomers.filter(customer =>
          customer.name.toLowerCase().includes(term) ||
          customer.phone.includes(term) ||
          (customer.email && customer.email.toLowerCase().includes(term))
        );

        // Lưu kết quả vào cache
        queryClient.setQueryData(['customers', 'search', searchTerm], filteredData);

        return filteredData;
      }

      // Fallback to mock data - filter mock data based on search term
      const mockData = [
        {
          _id: '1',
          id: '1',
          name: 'Nguyễn Văn A',
          phone: '0987654321',
          email: 'nguyenvana@example.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: '2',
          id: '2',
          name: 'Trần Thị B',
          phone: '0123456789',
          email: 'tranthib@example.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: '3',
          id: '3',
          name: 'Lê Văn C',
          phone: '0909123456',
          email: 'levanc@example.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const term = searchTerm.toLowerCase();
      const filteredMockData = mockData.filter(customer =>
        customer.name.toLowerCase().includes(term) ||
        customer.phone.includes(term) ||
        (customer.email && customer.email.toLowerCase().includes(term))
      );

      // Lưu kết quả vào cache
      queryClient.setQueryData(['customers', 'search', searchTerm], filteredMockData);

      return filteredMockData;
    }
  };

  // Lấy customer theo ID với cache
  const getCustomerById = async (id: string): Promise<CustomerData | null> => {
    // Kiểm tra xem có dữ liệu trong cache không
    const cachedData = queryClient.getQueryData<CustomerData>(['customers', id]);
    if (cachedData) {
      return cachedData;
    }

    // Kiểm tra xem có dữ liệu customers trong cache không
    const allCustomers = queryClient.getQueryData<CustomerData[]>(['customers']);
    if (allCustomers) {
      const customer = allCustomers.find(c => c._id === id || c.id === id);
      if (customer) {
        // Lưu kết quả vào cache
        queryClient.setQueryData(['customers', id], customer);
        return customer;
      }
    }

    try {
      const response = await fetch(`/api/customers/${id}`);
      if (!response.ok) {
        throw new Error(`Lỗi khi lấy customer với ID ${id}`);
      }
      const data = await response.json();

      // Lưu kết quả vào cache
      queryClient.setQueryData(['customers', id], data);

      return data;
    } catch (error) {
      console.error(`Lỗi khi lấy customer với ID ${id}:`, error);
      setError(`Lỗi khi lấy customer với ID ${id}`);
      return null;
    }
  };

  // Lấy customer theo số điện thoại với cache
  const getCustomerByPhone = async (phone: string): Promise<CustomerData | null> => {
    // Kiểm tra xem có dữ liệu trong cache không
    const cachedData = queryClient.getQueryData<CustomerData>(['customers', 'phone', phone]);
    if (cachedData) {
      return cachedData;
    }

    // Kiểm tra xem có dữ liệu customers trong cache không
    const allCustomers = queryClient.getQueryData<CustomerData[]>(['customers']);
    if (allCustomers) {
      const customer = allCustomers.find(c => c.phone === phone);
      if (customer) {
        // Lưu kết quả vào cache
        queryClient.setQueryData(['customers', 'phone', phone], customer);
        return customer;
      }
    }

    try {
      const response = await fetch(`/api/customers?phone=${encodeURIComponent(phone)}`);
      if (!response.ok) {
        throw new Error(`Lỗi khi lấy customer với số điện thoại ${phone}`);
      }
      const customers = await response.json();
      const customer = customers.length > 0 ? customers[0] : null;

      if (customer) {
        // Lưu kết quả vào cache
        queryClient.setQueryData(['customers', 'phone', phone], customer);
      }

      return customer;
    } catch (error) {
      console.error(`Lỗi khi lấy customer với số điện thoại ${phone}:`, error);
      setError(`Lỗi khi lấy customer với số điện thoại ${phone}`);
      return null;
    }
  };

  // Tạo customer mới
  const createCustomerMutation = useMutation(
    async (customer: CustomerData) => {
      try {
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customer),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Lỗi khi tạo customer');
        }

        return response.json();
      } catch (error) {
        console.error('Lỗi khi tạo customer:', error);
        throw error;
      }
    },
    {
      onSuccess: (newCustomer) => {
        // Cập nhật cache customers
        const previousCustomers = queryClient.getQueryData<CustomerData[]>(['customers']) || [];
        queryClient.setQueryData(['customers'], [newCustomer, ...previousCustomers]);

        // Cập nhật cache customer theo ID
        queryClient.setQueryData(['customers', newCustomer._id], newCustomer);
        if (newCustomer.id) {
          queryClient.setQueryData(['customers', newCustomer.id], newCustomer);
        }

        // Cập nhật cache customer theo phone
        queryClient.setQueryData(['customers', 'phone', newCustomer.phone], newCustomer);
      },
      onError: (error: Error) => {
        console.error('Lỗi khi tạo customer:', error);
        setError(error.message);
      },
    }
  );

  // Cập nhật customer
  const updateCustomerMutation = useMutation(
    async (customer: CustomerData) => {
      const id = customer._id || customer.id;
      if (!id) throw new Error('Customer ID không được cung cấp');

      try {
        const response = await fetch(`/api/customers/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customer),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Lỗi khi cập nhật customer với ID ${id}`);
        }

        return response.json();
      } catch (error) {
        console.error(`Lỗi khi cập nhật customer với ID ${id}:`, error);
        throw error;
      }
    },
    {
      onSuccess: (updatedCustomer) => {
        // Cập nhật cache customers
        const previousCustomers = queryClient.getQueryData<CustomerData[]>(['customers']);
        if (previousCustomers) {
          const updatedCustomers = previousCustomers.map(c =>
            (c._id === updatedCustomer._id || c.id === updatedCustomer.id) ? updatedCustomer : c
          );
          queryClient.setQueryData(['customers'], updatedCustomers);
        }

        // Cập nhật cache customer theo ID
        queryClient.setQueryData(['customers', updatedCustomer._id], updatedCustomer);
        if (updatedCustomer.id) {
          queryClient.setQueryData(['customers', updatedCustomer.id], updatedCustomer);
        }

        // Cập nhật cache customer theo phone
        queryClient.setQueryData(['customers', 'phone', updatedCustomer.phone], updatedCustomer);

        // Cập nhật cache tìm kiếm
        const queriesKeys = queryClient.getQueryCache().findAll(['customers', 'search']);
        queriesKeys.forEach(query => {
          const searchResults = query.state.data as CustomerData[];
          if (searchResults && Array.isArray(searchResults)) {
            const updatedResults = searchResults.map(c =>
              (c._id === updatedCustomer._id || c.id === updatedCustomer.id) ? updatedCustomer : c
            );
            queryClient.setQueryData(query.queryKey, updatedResults);
          }
        });
      },
      onError: (error: Error) => {
        console.error('Lỗi khi cập nhật customer:', error);
        setError(error.message);
      },
    }
  );

  // Lấy bookings của customer với cache
  const getCustomerBookings = async (customerId: string) => {
    // Kiểm tra xem có dữ liệu trong cache không
    const cachedData = queryClient.getQueryData(['bookings', 'customer', customerId]);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await fetch(`/api/customers/${customerId}/bookings`);
      if (!response.ok) {
        throw new Error(`Lỗi khi lấy bookings của customer với ID ${customerId}`);
      }
      const data = await response.json();

      // Lưu kết quả vào cache
      queryClient.setQueryData(['bookings', 'customer', customerId], data);

      return data;
    } catch (error) {
      console.error(`Lỗi khi lấy bookings của customer với ID ${customerId}:`, error);
      setError(`Lỗi khi lấy bookings của customer với ID ${customerId}`);
      return [];
    }
  };

  return {
    customers,
    isLoading,
    error,
    refetch,
    searchCustomers,
    getCustomerById,
    getCustomerByPhone,
    createCustomer: createCustomerMutation.mutateAsync,
    updateCustomer: updateCustomerMutation.mutateAsync,
    getCustomerBookings,
    isCreating: createCustomerMutation.isLoading,
    isUpdating: updateCustomerMutation.isLoading,
  };
};
