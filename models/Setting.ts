import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  type: 'invoice' | 'email' | 'payment' | 'general' | 'googleSheet' | 'googleCalendar';
  data: any;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ['invoice', 'email', 'payment', 'general', 'googleSheet', 'googleCalendar'],
      required: true,
    },
    data: { type: Schema.Types.Mixed, required: true },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Tạo index để tìm kiếm nhanh hơn
SettingSchema.index({ type: 1 });
SettingSchema.index({ isDefault: 1 });

export default mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);
