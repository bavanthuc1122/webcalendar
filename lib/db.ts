// Đây là một mô phỏng cơ sở dữ liệu đơn giản sử dụng localStorage
// Trong môi trường sản xuất, bạn nên sử dụng một cơ sở dữ liệu thực như MongoDB, Firebase, hoặc MySQL

export interface BookingData {
  id?: string;
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
}

export interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  bookings: string[]; // Array of booking IDs
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Lưu trữ dữ liệu đặt lịch
export const saveBooking = (booking: BookingData): BookingData => {
  try {
    // Tạo ID nếu chưa có
    if (!booking.id) {
      booking.id = `booking-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Thêm thời gian tạo và cập nhật
    if (!booking.createdAt) {
      booking.createdAt = new Date().toISOString();
    }
    booking.updatedAt = new Date().toISOString();
    
    // Lấy dữ liệu hiện tại
    const bookingsData = localStorage.getItem('bookings');
    let bookings: BookingData[] = [];
    
    if (bookingsData) {
      bookings = JSON.parse(bookingsData);
    }
    
    // Kiểm tra xem booking đã tồn tại chưa
    const existingIndex = bookings.findIndex(b => b.id === booking.id);
    
    if (existingIndex >= 0) {
      // Cập nhật booking hiện có
      bookings[existingIndex] = booking;
    } else {
      // Thêm booking mới
      bookings.push(booking);
      
      // Cập nhật thông tin khách hàng
      updateOrCreateCustomer(booking);
    }
    
    // Lưu lại vào localStorage
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    return booking;
  } catch (error) {
    console.error('Lỗi khi lưu booking:', error);
    throw error;
  }
};

// Lấy tất cả các đặt lịch
export const getAllBookings = (): BookingData[] => {
  try {
    const bookingsData = localStorage.getItem('bookings');
    
    if (!bookingsData) {
      return [];
    }
    
    return JSON.parse(bookingsData);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách booking:', error);
    return [];
  }
};

// Lấy đặt lịch theo ID
export const getBookingById = (id: string): BookingData | null => {
  try {
    const bookings = getAllBookings();
    return bookings.find(booking => booking.id === id) || null;
  } catch (error) {
    console.error(`Lỗi khi lấy booking với ID ${id}:`, error);
    return null;
  }
};

// Xóa đặt lịch
export const deleteBooking = (id: string): boolean => {
  try {
    const bookings = getAllBookings();
    const filteredBookings = bookings.filter(booking => booking.id !== id);
    
    if (filteredBookings.length === bookings.length) {
      return false; // Không tìm thấy booking để xóa
    }
    
    localStorage.setItem('bookings', JSON.stringify(filteredBookings));
    return true;
  } catch (error) {
    console.error(`Lỗi khi xóa booking với ID ${id}:`, error);
    return false;
  }
};

// Cập nhật hoặc tạo mới thông tin khách hàng
export const updateOrCreateCustomer = (booking: BookingData): CustomerData => {
  try {
    const customersData = localStorage.getItem('customers');
    let customers: CustomerData[] = [];
    
    if (customersData) {
      customers = JSON.parse(customersData);
    }
    
    // Tìm khách hàng theo số điện thoại
    let customer = customers.find(c => c.phone === booking.phone);
    
    if (customer) {
      // Cập nhật thông tin khách hàng hiện có
      if (!customer.bookings.includes(booking.id)) {
        customer.bookings.push(booking.id);
      }
      customer.name = booking.customer; // Cập nhật tên nếu có thay đổi
      customer.updatedAt = new Date().toISOString();
    } else {
      // Tạo khách hàng mới
      customer = {
        id: `customer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: booking.customer,
        phone: booking.phone,
        bookings: [booking.id],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      customers.push(customer);
    }
    
    // Lưu lại vào localStorage
    localStorage.setItem('customers', JSON.stringify(customers));
    
    return customer;
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin khách hàng:', error);
    throw error;
  }
};

// Lấy tất cả khách hàng
export const getAllCustomers = (): CustomerData[] => {
  try {
    const customersData = localStorage.getItem('customers');
    
    if (!customersData) {
      return [];
    }
    
    return JSON.parse(customersData);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách hàng:', error);
    return [];
  }
};

// Lấy khách hàng theo ID
export const getCustomerById = (id: string): CustomerData | null => {
  try {
    const customers = getAllCustomers();
    return customers.find(customer => customer.id === id) || null;
  } catch (error) {
    console.error(`Lỗi khi lấy khách hàng với ID ${id}:`, error);
    return null;
  }
};

// Lấy khách hàng theo số điện thoại
export const getCustomerByPhone = (phone: string): CustomerData | null => {
  try {
    const customers = getAllCustomers();
    return customers.find(customer => customer.phone === phone) || null;
  } catch (error) {
    console.error(`Lỗi khi lấy khách hàng với số điện thoại ${phone}:`, error);
    return null;
  }
};

// Lấy tất cả đặt lịch của một khách hàng
export const getBookingsByCustomer = (customerId: string): BookingData[] => {
  try {
    const customer = getCustomerById(customerId);
    
    if (!customer) {
      return [];
    }
    
    const allBookings = getAllBookings();
    return allBookings.filter(booking => customer.bookings.includes(booking.id));
  } catch (error) {
    console.error(`Lỗi khi lấy danh sách booking của khách hàng ${customerId}:`, error);
    return [];
  }
};

// Lưu cài đặt thanh toán
export interface PaymentSettings {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
  qrCodeUrl?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Lưu cài đặt thanh toán
export const savePaymentSettings = (settings: PaymentSettings): PaymentSettings => {
  try {
    // Tạo ID nếu chưa có
    if (!settings.id) {
      settings.id = `payment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Thêm thời gian tạo và cập nhật
    if (!settings.createdAt) {
      settings.createdAt = new Date().toISOString();
    }
    settings.updatedAt = new Date().toISOString();
    
    // Lấy dữ liệu hiện tại
    const settingsData = localStorage.getItem('paymentSettings');
    let allSettings: PaymentSettings[] = [];
    
    if (settingsData) {
      allSettings = JSON.parse(settingsData);
    }
    
    // Kiểm tra xem settings đã tồn tại chưa
    const existingIndex = allSettings.findIndex(s => s.id === settings.id);
    
    if (existingIndex >= 0) {
      // Cập nhật settings hiện có
      allSettings[existingIndex] = settings;
    } else {
      // Thêm settings mới
      allSettings.push(settings);
    }
    
    // Nếu settings mới là mặc định, cập nhật các settings khác
    if (settings.isDefault) {
      allSettings.forEach((s, index) => {
        if (s.id !== settings.id && s.isDefault) {
          allSettings[index].isDefault = false;
        }
      });
    }
    
    // Lưu lại vào localStorage
    localStorage.setItem('paymentSettings', JSON.stringify(allSettings));
    
    return settings;
  } catch (error) {
    console.error('Lỗi khi lưu cài đặt thanh toán:', error);
    throw error;
  }
};

// Lấy tất cả cài đặt thanh toán
export const getAllPaymentSettings = (): PaymentSettings[] => {
  try {
    const settingsData = localStorage.getItem('paymentSettings');
    
    if (!settingsData) {
      return [];
    }
    
    return JSON.parse(settingsData);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách cài đặt thanh toán:', error);
    return [];
  }
};

// Lấy cài đặt thanh toán mặc định
export const getDefaultPaymentSettings = (): PaymentSettings | null => {
  try {
    const allSettings = getAllPaymentSettings();
    return allSettings.find(s => s.isDefault) || null;
  } catch (error) {
    console.error('Lỗi khi lấy cài đặt thanh toán mặc định:', error);
    return null;
  }
};
