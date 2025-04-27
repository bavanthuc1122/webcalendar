import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  customer: string;
  time: string;
  date: string;
  duration: number;
  deposit: number;
  total: number;
  phone: string;
  concepts?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  calendarEventId?: string;
  invoiceUrl?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  customerId: mongoose.Types.ObjectId;
}

const BookingSchema: Schema = new Schema(
  {
    customer: { type: String, required: true },
    time: { type: String, required: true },
    date: { type: String, required: true },
    duration: { type: Number, required: true, default: 2 },
    deposit: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    phone: { type: String, required: true },
    concepts: { type: String },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    calendarEventId: { type: String },
    invoiceUrl: { type: String },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  },
  {
    timestamps: true,
  }
);

// Tạo index để tìm kiếm nhanh hơn
BookingSchema.index({ phone: 1 });
BookingSchema.index({ date: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ customerId: 1 });

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
