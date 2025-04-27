// Script để kiểm tra kết nối MongoDB và tạo dữ liệu mẫu
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI không được định nghĩa trong .env.local');
  process.exit(1);
}

async function main() {
  try {
    // Kết nối đến MongoDB
    console.log('Đang kết nối đến MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Đã kết nối thành công đến MongoDB!');

    // Định nghĩa schema Customer
    const CustomerSchema = new mongoose.Schema(
      {
        name: { type: String, required: true },
        phone: { type: String, required: true, unique: true },
        email: { type: String },
        notes: { type: String },
      },
      {
        timestamps: true,
      }
    );

    // Tạo model Customer
    const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);

    // Tạo khách hàng mẫu
    console.log('Đang tạo khách hàng mẫu...');
    const customers = [
      {
        name: 'Nguyễn Văn A',
        phone: '0987654321',
        email: 'nguyenvana@example.com',
      },
      {
        name: 'Trần Thị B',
        phone: '0123456789',
        email: 'tranthib@example.com',
      },
      {
        name: 'Lê Văn C',
        phone: '0909123456',
        email: 'levanc@example.com',
      },
    ];

    // Thêm khách hàng vào cơ sở dữ liệu
    for (const customer of customers) {
      try {
        // Kiểm tra xem khách hàng đã tồn tại chưa
        const existingCustomer = await Customer.findOne({ phone: customer.phone });
        if (existingCustomer) {
          console.log(`Khách hàng với số điện thoại ${customer.phone} đã tồn tại.`);
        } else {
          const newCustomer = new Customer(customer);
          await newCustomer.save();
          console.log(`Đã tạo khách hàng: ${customer.name}`);
        }
      } catch (error) {
        console.error(`Lỗi khi tạo khách hàng ${customer.name}:`, error);
      }
    }

    // Lấy danh sách khách hàng
    const allCustomers = await Customer.find();
    console.log(`Tổng số khách hàng: ${allCustomers.length}`);
    console.log('Danh sách khách hàng:');
    allCustomers.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.name} - ${customer.phone}`);
    });

    // Định nghĩa schema Setting
    const SettingSchema = new mongoose.Schema(
      {
        type: {
          type: String,
          enum: ['invoice', 'email', 'payment', 'general', 'googleSheet', 'invoiceSettings', 'adminEmail'],
          required: true,
        },
        data: { type: mongoose.Schema.Types.Mixed, required: true },
        isDefault: { type: Boolean, default: false },
      },
      {
        timestamps: true,
      }
    );

    // Tạo model Setting
    const Setting = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);

    // Tạo cài đặt mẫu
    console.log('Đang tạo cài đặt mẫu...');
    const settings = [
      {
        type: 'invoice',
        data: {
          companyName: 'Studio Ảnh Thức',
          companyAddress: '123 Đường ABC, Quận 1, TP.HCM',
          companyPhone: '0987654321',
          companyEmail: 'contact@anhthuc.com',
          companyWebsite: 'www.anhthuc.com',
          companyLogo: '',
          vatRate: 10,
          invoicePrefix: 'INV-',
          invoiceFooter: 'Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!',
        },
        isDefault: true,
      },
      {
        type: 'email',
        data: {
          host: 'smtp.gmail.com',
          port: '587',
          user: 'your-email@gmail.com',
          pass: '',
        },
        isDefault: true,
      },
      {
        type: 'googleSheet',
        data: {
          apiKey: '',
          sheetId: '',
          sheetName: 'Customers',
        },
        isDefault: true,
      },
      {
        type: 'adminEmail',
        data: 'admin@anhthuc.com',
        isDefault: true,
      },
    ];

    // Thêm cài đặt vào cơ sở dữ liệu
    for (const setting of settings) {
      try {
        // Kiểm tra xem cài đặt đã tồn tại chưa
        const existingSetting = await Setting.findOne({ type: setting.type, isDefault: true });
        if (existingSetting) {
          console.log(`Cài đặt loại ${setting.type} đã tồn tại.`);
        } else {
          const newSetting = new Setting(setting);
          await newSetting.save();
          console.log(`Đã tạo cài đặt: ${setting.type}`);
        }
      } catch (error) {
        console.error(`Lỗi khi tạo cài đặt ${setting.type}:`, error);
      }
    }

    // Lấy danh sách cài đặt
    const allSettings = await Setting.find();
    console.log(`Tổng số cài đặt: ${allSettings.length}`);
    console.log('Danh sách cài đặt:');
    allSettings.forEach((setting, index) => {
      console.log(`${index + 1}. ${setting.type} - isDefault: ${setting.isDefault}`);
    });

    console.log('Kiểm tra MongoDB hoàn tất!');
  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    // Đóng kết nối
    await mongoose.disconnect();
    console.log('Đã đóng kết nối MongoDB');
    process.exit(0);
  }
}

main();
