import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, releaseConnection } from '@/lib/mongodb';
import { Setting, SettingHistory } from '@/models';
import mongoose from 'mongoose';

// POST /api/settings/restore - Khôi phục cấu hình từ lịch sử
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { historyId } = body;

    if (!historyId) {
      return NextResponse.json(
        { error: 'ID lịch sử cấu hình là bắt buộc' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Tìm bản ghi lịch sử cấu hình
    const historyRecord = await SettingHistory.findById(historyId);
    
    if (!historyRecord) {
      releaseConnection();
      return NextResponse.json(
        { error: 'Không tìm thấy bản ghi lịch sử cấu hình' },
        { status: 404 }
      );
    }

    // Tìm cấu hình hiện tại
    const currentSetting = await Setting.findById(historyRecord.settingId);
    
    if (!currentSetting) {
      releaseConnection();
      return NextResponse.json(
        { error: 'Không tìm thấy cấu hình hiện tại' },
        { status: 404 }
      );
    }

    // Lưu cấu hình hiện tại vào lịch sử trước khi khôi phục
    const newHistoryRecord = new SettingHistory({
      settingId: currentSetting._id,
      type: currentSetting.type,
      data: currentSetting.data,
      changeType: 'update',
      changedBy: body.userId || 'system'
    });
    
    await newHistoryRecord.save();

    // Cập nhật cấu hình hiện tại với dữ liệu từ lịch sử
    currentSetting.data = historyRecord.data;
    currentSetting.updatedAt = new Date();
    await currentSetting.save();

    // Tạo bản ghi lịch sử mới cho việc khôi phục
    const restoreHistoryRecord = new SettingHistory({
      settingId: currentSetting._id,
      type: currentSetting.type,
      data: historyRecord.data,
      changeType: 'restore',
      changedBy: body.userId || 'system'
    });
    
    await restoreHistoryRecord.save();

    // Giải phóng kết nối MongoDB
    releaseConnection();

    return NextResponse.json({
      success: true,
      message: 'Đã khôi phục cấu hình thành công',
      setting: currentSetting
    });
  } catch (error) {
    console.error('Lỗi khi khôi phục cấu hình:', error);

    // Giải phóng kết nối MongoDB
    releaseConnection();

    return NextResponse.json(
      { error: 'Lỗi khi khôi phục cấu hình' },
      { status: 500 }
    );
  }
}
