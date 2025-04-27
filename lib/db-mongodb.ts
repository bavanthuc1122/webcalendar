// Đây là phiên bản MongoDB của lib/db.ts
// Sử dụng các API routes đã tạo để tương tác với MongoDB

import { connectToDatabase } from './mongodb';
import mongoose from 'mongoose';
import { Booking, Customer, Setting } from '@/models';

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
  createdAt: string;
  updatedAt: string;
  calendarEventId?: string;
  invoiceUrl?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  customerId?: string;
}

export interface CustomerData {
  id?: string;
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSettings {
  id?: string;
  _id?: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
  qrCodeUrl?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Hàm chuyển đổi _id thành id cho client
const convertIdForClient = (data: any) => {
  if (!data) return null;
  
  const result = { ...data };
  if (result._id) {
    result.id = result._id.toString();
  }
  return result;
};

// Lưu trữ dữ liệu đặt lịch
export const saveBooking = async (booking: BookingData): Promise<BookingData> => {
  try {
    await connectToDatabase();
    
    // Tìm hoặc tạo khách hàng
    let customer = await Customer.findOne({ phone: booking.phone });
    
    if (!customer) {
      // Tạo khách hàng mới
      customer = new Customer({
        name: booking.customer,
        phone: booking.phone,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await customer.save();
    }
    
    // Cập nhật hoặc tạo booking
    let bookingDoc;
    
    if (booking._id || booking.id) {
      const bookingId = booking._id || booking.id;
      // Cập nhật booking hiện có
      bookingDoc = await Booking.findByIdAndUpdate(
        bookingId,
        {
          ...booking,
          customerId: customer._id,
          updatedAt: new Date()
        },
        { new: true }
      );
    } else {
      // Tạo booking mới
      bookingDoc = new Booking({
        ...booking,
        customerId: customer._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await bookingDoc.save();
    }
    
    // Chuyển đổi dữ liệu để trả về
    const result = bookingDoc.toObject();
    return convertIdForClient(result);
  } catch (error) {
    console.error('Lỗi khi lưu booking:', error);
    throw error;
  }
};

// Lấy tất cả các đặt lịch
export const getAllBookings = async (): Promise<BookingData[]> => {
  try {
    await connectToDatabase();
    const bookings = await Booking.find().sort({ createdAt: -1 });
    return bookings.map(booking => convertIdForClient(booking.toObject()));
  } catch (error) {
    console.error('Lỗi khi lấy danh sách booking:', error);
    return [];
  }
};

// Lấy đặt lịch theo ID
export const getBookingById = async (id: string): Promise<BookingData | null> => {
  try {
    await connectToDatabase();
    const booking = await Booking.findById(id);
    return booking ? convertIdForClient(booking.toObject()) : null;
  } catch (error) {
    console.error(`Lỗi khi lấy booking với ID ${id}:`, error);
    return null;
  }
};

// Xóa đặt lịch
export const deleteBooking = async (id: string): Promise<boolean> => {
  try {
    await connectToDatabase();
    const result = await Booking.findByIdAndDelete(id);
    return !!result;
  } catch (error) {
    console.error(`Lỗi khi xóa booking với ID ${id}:`, error);
    return false;
  }
};

// Cập nhật hoặc tạo mới thông tin khách hàng
export const updateOrCreateCustomer = async (booking: BookingData): Promise<CustomerData> => {
  try {
    await connectToDatabase();
    
    // Tìm khách hàng theo số điện thoại
    let customer = await Customer.findOne({ phone: booking.phone });
    
    if (customer) {
      // Cập nhật thông tin khách hàng hiện có
      customer.name = booking.customer;
      customer.updatedAt = new Date();
      await customer.save();
    } else {
      // Tạo khách hàng mới
      customer = new Customer({
        name: booking.customer,
        phone: booking.phone,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await customer.save();
    }
    
    return convertIdForClient(customer.toObject());
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin khách hàng:', error);
    throw error;
  }
};

// Lấy tất cả khách hàng
export const getAllCustomers = async (): Promise<CustomerData[]> => {
  try {
    await connectToDatabase();
    const customers = await Customer.find().sort({ createdAt: -1 });
    return customers.map(customer => convertIdForClient(customer.toObject()));
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách hàng:', error);
    return [];
  }
};

// Lấy khách hàng theo ID
export const getCustomerById = async (id: string): Promise<CustomerData | null> => {
  try {
    await connectToDatabase();
    const customer = await Customer.findById(id);
    return customer ? convertIdForClient(customer.toObject()) : null;
  } catch (error) {
    console.error(`Lỗi khi lấy khách hàng với ID ${id}:`, error);
    return null;
  }
};

// Lấy khách hàng theo số điện thoại
export const getCustomerByPhone = async (phone: string): Promise<CustomerData | null> => {
  try {
    await connectToDatabase();
    const customer = await Customer.findOne({ phone });
    return customer ? convertIdForClient(customer.toObject()) : null;
  } catch (error) {
    console.error(`Lỗi khi lấy khách hàng với số điện thoại ${phone}:`, error);
    return null;
  }
};

// Lấy tất cả đặt lịch của một khách hàng
export const getBookingsByCustomer = async (customerId: string): Promise<BookingData[]> => {
  try {
    await connectToDatabase();
    const bookings = await Booking.find({ customerId }).sort({ createdAt: -1 });
    return bookings.map(booking => convertIdForClient(booking.toObject()));
  } catch (error) {
    console.error(`Lỗi khi lấy danh sách booking của khách hàng ${customerId}:`, error);
    return [];
  }
};

// Lưu cài đặt thanh toán
export const savePaymentSettings = async (settings: PaymentSettings): Promise<PaymentSettings> => {
  try {
    await connectToDatabase();
    
    // Tạo dữ liệu cho setting
    const settingData = {
      type: 'payment',
      data: settings,
      isDefault: settings.isDefault
    };
    
    let settingDoc;
    
    if (settings._id || settings.id) {
      const settingId = settings._id || settings.id;
      
      // Nếu setting mới là mặc định, cập nhật các setting khác
      if (settings.isDefault) {
        await Setting.updateMany(
          { type: 'payment', isDefault: true, _id: { $ne: settingId } },
          { isDefault: false }
        );
      }
      
      // Cập nhật setting hiện có
      settingDoc = await Setting.findByIdAndUpdate(
        settingId,
        {
          ...settingData,
          updatedAt: new Date()
        },
        { new: true }
      );
    } else {
      // Nếu setting mới là mặc định, cập nhật các setting khác
      if (settings.isDefault) {
        await Setting.updateMany(
          { type: 'payment', isDefault: true },
          { isDefault: false }
        );
      }
      
      // Tạo setting mới
      settingDoc = new Setting({
        ...settingData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await settingDoc.save();
    }
    
    // Chuyển đổi dữ liệu để trả về
    const result = settingDoc.toObject();
    return {
      ...result.data,
      id: result._id.toString(),
      _id: result._id.toString(),
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString()
    };
  } catch (error) {
    console.error('Lỗi khi lưu cài đặt thanh toán:', error);
    throw error;
  }
};

// Lấy tất cả cài đặt thanh toán
export const getAllPaymentSettings = async (): Promise<PaymentSettings[]> => {
  try {
    await connectToDatabase();
    const settings = await Setting.find({ type: 'payment' }).sort({ createdAt: -1 });
    
    return settings.map(setting => {
      const data = setting.toObject();
      return {
        ...data.data,
        id: data._id.toString(),
        _id: data._id.toString(),
        isDefault: data.isDefault,
        createdAt: data.createdAt.toISOString(),
        updatedAt: data.updatedAt.toISOString()
      };
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách cài đặt thanh toán:', error);
    return [];
  }
};

// Lấy cài đặt thanh toán mặc định
export const getDefaultPaymentSettings = async (): Promise<PaymentSettings | null> => {
  try {
    await connectToDatabase();
    const setting = await Setting.findOne({ type: 'payment', isDefault: true });
    
    if (!setting) return null;
    
    const data = setting.toObject();
    return {
      ...data.data,
      id: data._id.toString(),
      _id: data._id.toString(),
      isDefault: data.isDefault,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString()
    };
  } catch (error) {
    console.error('Lỗi khi lấy cài đặt thanh toán mặc định:', error);
    return null;
  }
};
