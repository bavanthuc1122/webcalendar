import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema(
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

// Tạo index để tìm kiếm nhanh hơn
CustomerSchema.index({ phone: 1 }, { unique: true });
CustomerSchema.index({ name: 'text' });

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
