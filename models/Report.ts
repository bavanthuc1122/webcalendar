import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalBookings: number;
  totalRevenue: number;
  completedBookings: number;
  cancelledBookings: number;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    cancelledBookings: { type: Number, default: 0 },
    data: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Tạo index để tìm kiếm nhanh hơn
ReportSchema.index({ type: 1 });
ReportSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
