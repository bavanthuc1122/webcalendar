import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  id?: string;
  _id?: string;
  invoiceNumber: string;
  bookingId: string;
  customerId: string;
  amount: number;
  paidAmount: number;
  items: InvoiceItem[];
  status: 'unpaid' | 'partial' | 'paid';
  pdfUrl?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const useInvoices = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Lấy tất cả invoices
  const { data: invoices, isLoading, refetch } = useQuery<InvoiceData[]>(
    'invoices',
    async () => {
      try {
        const response = await fetch('/api/invoices');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Lỗi khi lấy danh sách invoices');
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

  // Lấy invoice theo ID
  const getInvoiceById = async (id: string): Promise<InvoiceData | null> => {
    try {
      const response = await fetch(`/api/invoices/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Lỗi khi lấy invoice với ID ${id}`);
      }
      return response.json();
    } catch (error) {
      setError(error.message);
      return null;
    }
  };

  // Lấy invoice theo bookingId
  const getInvoiceByBookingId = async (bookingId: string): Promise<InvoiceData | null> => {
    try {
      const response = await fetch(`/api/invoices?bookingId=${bookingId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Lỗi khi lấy invoice với bookingId ${bookingId}`);
      }
      const invoices = await response.json();
      return invoices.length > 0 ? invoices[0] : null;
    } catch (error) {
      setError(error.message);
      return null;
    }
  };

  // Tạo invoice mới
  const createInvoiceMutation = useMutation(
    async (invoice: InvoiceData) => {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoice),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi khi tạo invoice');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
      },
      onError: (error: Error) => {
        setError(error.message);
      },
    }
  );

  // Cập nhật invoice
  const updateInvoiceMutation = useMutation(
    async (invoice: InvoiceData) => {
      const id = invoice._id || invoice.id;
      if (!id) throw new Error('Invoice ID không được cung cấp');

      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoice),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Lỗi khi cập nhật invoice với ID ${id}`);
      }

      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
      },
      onError: (error: Error) => {
        setError(error.message);
      },
    }
  );

  // Tạo số hóa đơn mới
  const generateInvoiceNumber = async (): Promise<string> => {
    const prefix = 'INV-';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Lấy tất cả hóa đơn để tìm số cuối cùng
    const allInvoices = await fetch('/api/invoices').then(res => res.json());
    
    // Lọc các hóa đơn có cùng prefix và cùng tháng/năm
    const currentMonthInvoices = allInvoices.filter((invoice: InvoiceData) => 
      invoice.invoiceNumber.startsWith(`${prefix}${year}${month}`)
    );
    
    // Tìm số lớn nhất
    let maxNumber = 0;
    currentMonthInvoices.forEach((invoice: InvoiceData) => {
      const numberPart = invoice.invoiceNumber.slice(prefix.length + 4); // Bỏ qua prefix + YYMM
      const number = parseInt(numberPart, 10);
      if (!isNaN(number) && number > maxNumber) {
        maxNumber = number;
      }
    });
    
    // Tạo số mới
    const newNumber = (maxNumber + 1).toString().padStart(4, '0');
    return `${prefix}${year}${month}${newNumber}`;
  };

  return {
    invoices,
    isLoading,
    error,
    refetch,
    getInvoiceById,
    getInvoiceByBookingId,
    createInvoice: createInvoiceMutation.mutateAsync,
    updateInvoice: updateInvoiceMutation.mutateAsync,
    generateInvoiceNumber,
    isCreating: createInvoiceMutation.isLoading,
    isUpdating: updateInvoiceMutation.isLoading,
  };
};
