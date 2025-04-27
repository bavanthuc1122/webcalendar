import mongoose, { Schema, Document } from 'mongoose';

export interface ISettingHistory extends Document {
  settingId: mongoose.Types.ObjectId;
  type: 'invoice' | 'email' | 'payment' | 'general' | 'googleSheet' | 'googleCalendar' | 'invoiceSettings';
  data: any;
  changedBy?: string; // ID người dùng hoặc thông tin người thay đổi
  changeType: 'create' | 'update' | 'delete' | 'restore';
  createdAt: Date;
}

const SettingHistorySchema: Schema = new Schema(
  {
    settingId: {
      type: Schema.Types.ObjectId,
      ref: 'Setting',
      required: true
    },
    type: {
      type: String,
      enum: ['invoice', 'email', 'payment', 'general', 'googleSheet', 'googleCalendar', 'invoiceSettings'],
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true
    },
    changedBy: {
      type: String
    },
    changeType: {
      type: String,
      enum: ['create', 'update', 'delete', 'restore'],
      required: true,
      default: 'update'
    }
  },
  {
    timestamps: true,
  }
);

// Tạo index để tìm kiếm nhanh hơn
SettingHistorySchema.index({ settingId: 1 });
SettingHistorySchema.index({ type: 1 });
SettingHistorySchema.index({ createdAt: -1 });

export default mongoose.models.SettingHistory || mongoose.model<ISettingHistory>('SettingHistory', SettingHistorySchema);
