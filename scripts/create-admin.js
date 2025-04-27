// Script để tạo tài khoản admin
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

    // Định nghĩa schema User
    const UserSchema = new mongoose.Schema(
      {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: {
          type: String,
          enum: ['admin', 'staff'],
          default: 'staff',
        },
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date },
        emailVerified: { type: Boolean, default: false },
        emailVerificationToken: { type: String },
        emailVerificationExpires: { type: Date },
        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },
        googleId: { type: String },
      },
      {
        timestamps: true,
      }
    );

    // Tạo model User
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Thông tin tài khoản admin
    const adminData = {
      name: 'Admin',
      email: 'admin@anhthuc.com',
      password: 'admin123', // Mật khẩu đơn giản để dễ nhớ
      role: 'admin',
      isActive: true,
      emailVerified: true, // Đã xác thực email
    };

    // Kiểm tra xem tài khoản admin đã tồn tại chưa
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log(`Tài khoản admin với email ${adminData.email} đã tồn tại.`);
      console.log('Thông tin đăng nhập:');
      console.log(`Email: ${adminData.email}`);
      console.log(`Mật khẩu: ${adminData.password}`);
    } else {
      // Mã hóa mật khẩu
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      adminData.password = hashedPassword;

      // Tạo tài khoản admin
      const admin = new User(adminData);
      await admin.save();
      console.log(`Đã tạo tài khoản admin: ${adminData.email}`);
      console.log('Thông tin đăng nhập:');
      console.log(`Email: ${adminData.email}`);
      console.log(`Mật khẩu: ${adminData.password} (chưa mã hóa: admin123)`);
    }

    // Tạo tài khoản nhân viên
    const staffData = {
      name: 'Nhân viên',
      email: 'staff@anhthuc.com',
      password: 'staff123', // Mật khẩu đơn giản để dễ nhớ
      role: 'staff',
      isActive: true,
      emailVerified: true, // Đã xác thực email
    };

    // Kiểm tra xem tài khoản nhân viên đã tồn tại chưa
    const existingStaff = await User.findOne({ email: staffData.email });
    if (existingStaff) {
      console.log(`Tài khoản nhân viên với email ${staffData.email} đã tồn tại.`);
      console.log('Thông tin đăng nhập:');
      console.log(`Email: ${staffData.email}`);
      console.log(`Mật khẩu: ${staffData.password}`);
    } else {
      // Mã hóa mật khẩu
      const hashedPassword = await bcrypt.hash(staffData.password, 10);
      staffData.password = hashedPassword;

      // Tạo tài khoản nhân viên
      const staff = new User(staffData);
      await staff.save();
      console.log(`Đã tạo tài khoản nhân viên: ${staffData.email}`);
      console.log('Thông tin đăng nhập:');
      console.log(`Email: ${staffData.email}`);
      console.log(`Mật khẩu: ${staffData.password} (chưa mã hóa: staff123)`);
    }

    console.log('Tạo tài khoản hoàn tất!');
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
