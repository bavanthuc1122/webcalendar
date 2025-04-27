import mongoose, { Schema, Document } from 'mongoose';
import { hash, compare } from 'bcrypt';
import crypto from 'crypto';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  lastLogin?: Date;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateVerificationToken(): { token: string, expires: Date };
  generatePasswordResetToken(): { token: string, expires: Date };
}

const UserSchema: Schema = new Schema(
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

// Mã hóa mật khẩu trước khi lưu
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    // Mật khẩu được mã hóa ngay cả khi ngắn
    const hashedPassword = await hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Phương thức so sánh mật khẩu
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return compare(candidatePassword, this.password);
};

// Phương thức tạo token xác thực email
UserSchema.methods.generateVerificationToken = function (): { token: string, expires: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // Token hết hạn sau 24 giờ

  this.emailVerificationToken = token;
  this.emailVerificationExpires = expires;

  return { token, expires };
};

// Phương thức tạo token đặt lại mật khẩu
UserSchema.methods.generatePasswordResetToken = function (): { token: string, expires: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // Token hết hạn sau 1 giờ

  this.resetPasswordToken = token;
  this.resetPasswordExpires = expires;

  return { token, expires };
};

// Tạo index để tìm kiếm nhanh hơn
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ emailVerificationToken: 1 });
UserSchema.index({ resetPasswordToken: 1 });
UserSchema.index({ googleId: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
