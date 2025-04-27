// Script để chuyển đổi dữ liệu từ localStorage sang MongoDB
// Chạy script này bằng cách: npx ts-node scripts/migrate-to-mongodb.ts

import { connectToDatabase, disconnectFromDatabase } from '../lib/mongodb';
import { Booking, Customer, Setting, Invoice } from '../models';
import mongoose from 'mongoose';

// Hàm chuyển đổi dữ liệu từ localStorage sang MongoDB
async function migrateToMongoDB() {
  try {
    console.log('Bắt đầu chuyển đổi dữ liệu từ localStorage sang MongoDB...');
    
    // Kết nối đến MongoDB
    await connectToDatabase();
    console.log('Đã kết nối đến MongoDB');
    
    // Kiểm tra xem có dữ liệu trong localStorage không
    if (typeof window === 'undefined') {
      console.error('Script này chỉ có thể chạy trong trình duyệt');
      return;
    }
    
    // Chuyển đổi dữ liệu khách hàng
    const customersData = localStorage.getItem('customers');
    if (customersData) {
      const customers = JSON.parse(customersData);
      console.log(`Tìm thấy ${customers.length} khách hàng trong localStorage`);
      
      // Tạo map để lưu trữ ID cũ và ID mới của khách hàng
      const customerIdMap = new Map();
      
      // Chuyển đổi từng khách hàng
      for (const customer of customers) {
        const newCustomer = new Customer({
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          notes: customer.notes,
          createdAt: new Date(customer.createdAt),
          updatedAt: new Date(customer.updatedAt)
        });
        
        await newCustomer.save();
        customerIdMap.set(customer.id, newCustomer._id);
        console.log(`Đã chuyển đổi khách hàng: ${customer.name}`);
      }
      
      // Chuyển đổi dữ liệu đặt lịch
      const bookingsData = localStorage.getItem('bookings');
      if (bookingsData) {
        const bookings = JSON.parse(bookingsData);
        console.log(`Tìm thấy ${bookings.length} đặt lịch trong localStorage`);
        
        // Chuyển đổi từng đặt lịch
        for (const booking of bookings) {
          // Tìm khách hàng tương ứng
          const customer = await Customer.findOne({ phone: booking.phone });
          
          if (customer) {
            const newBooking = new Booking({
              customer: booking.customer,
              time: booking.time,
              date: booking.date,
              duration: booking.duration,
              deposit: booking.deposit,
              total: booking.total,
              phone: booking.phone,
              concepts: booking.concepts,
              status: booking.status,
              calendarEventId: booking.calendarEventId,
              invoiceUrl: booking.invoiceUrl,
              paymentStatus: booking.paymentStatus || 'unpaid',
              customerId: customer._id,
              createdAt: new Date(booking.createdAt),
              updatedAt: new Date(booking.updatedAt)
            });
            
            await newBooking.save();
            console.log(`Đã chuyển đổi đặt lịch: ${booking.customer} - ${booking.date}`);
          } else {
            console.warn(`Không tìm thấy khách hàng cho đặt lịch: ${booking.customer}`);
          }
        }
      }
      
      // Chuyển đổi cài đặt thanh toán
      const paymentSettingsData = localStorage.getItem('paymentSettings');
      if (paymentSettingsData) {
        const paymentSettings = JSON.parse(paymentSettingsData);
        console.log(`Tìm thấy ${paymentSettings.length} cài đặt thanh toán trong localStorage`);
        
        // Chuyển đổi từng cài đặt thanh toán
        for (const setting of paymentSettings) {
          const newSetting = new Setting({
            type: 'payment',
            data: {
              bankName: setting.bankName,
              accountNumber: setting.accountNumber,
              accountName: setting.accountName,
              branch: setting.branch,
              qrCodeUrl: setting.qrCodeUrl
            },
            isDefault: setting.isDefault,
            createdAt: new Date(setting.createdAt),
            updatedAt: new Date(setting.updatedAt)
          });
          
          await newSetting.save();
          console.log(`Đã chuyển đổi cài đặt thanh toán: ${setting.bankName}`);
        }
      }
      
      // Chuyển đổi cài đặt email
      const emailConfigData = localStorage.getItem('emailConfig');
      if (emailConfigData) {
        const emailConfig = JSON.parse(emailConfigData);
        console.log('Tìm thấy cài đặt email trong localStorage');
        
        const newSetting = new Setting({
          type: 'email',
          data: emailConfig,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await newSetting.save();
        console.log('Đã chuyển đổi cài đặt email');
      }
      
      // Chuyển đổi cài đặt hóa đơn
      const invoiceConfigData = localStorage.getItem('invoiceConfig');
      if (invoiceConfigData) {
        const invoiceConfig = JSON.parse(invoiceConfigData);
        console.log('Tìm thấy cài đặt hóa đơn trong localStorage');
        
        const newSetting = new Setting({
          type: 'invoice',
          data: invoiceConfig,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await newSetting.save();
        console.log('Đã chuyển đổi cài đặt hóa đơn');
      }
      
      console.log('Chuyển đổi dữ liệu hoàn tất!');
    } else {
      console.log('Không tìm thấy dữ liệu khách hàng trong localStorage');
    }
  } catch (error) {
    console.error('Lỗi khi chuyển đổi dữ liệu:', error);
  } finally {
    // Đóng kết nối đến MongoDB
    await disconnectFromDatabase();
    console.log('Đã đóng kết nối đến MongoDB');
  }
}

// Chạy hàm chuyển đổi
migrateToMongoDB();
