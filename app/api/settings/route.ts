import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting, SettingHistory } from '@/models';

// GET /api/settings - Lấy tất cả các settings hoặc theo loại
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const isDefault = searchParams.get('isDefault') === 'true';

    await connectToDatabase();

    // Xây dựng query dựa trên các tham số
    const query: any = {};
    if (type) query.type = type;
    if (isDefault) query.isDefault = true;

    const settings = await Setting.find(query);
    // Không cần giải phóng kết nối MongoDB vì nó được quản lý tự động

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách settings:', error);

    // Không cần giải phóng kết nối MongoDB vì nó được quản lý tự động

    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings - Tạo setting mới
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectToDatabase();

    // Nếu setting mới là mặc định, cập nhật các setting khác cùng loại
    if (body.isDefault) {
      await Setting.updateMany(
        { type: body.type, isDefault: true },
        { isDefault: false }
      );
    }

    // Kiểm tra xem setting đã tồn tại chưa
    let setting;
    let isNewSetting = false;
    let oldData = null;

    if (body._id || body.id) {
      const settingId = body._id || body.id;

      // Lấy dữ liệu cũ trước khi cập nhật
      const oldSetting = await Setting.findById(settingId);
      if (oldSetting) {
        oldData = oldSetting.data;
      }

      setting = await Setting.findByIdAndUpdate(
        settingId,
        { ...body, updatedAt: new Date() },
        { new: true }
      );
    } else {
      setting = new Setting(body);
      await setting.save();
      isNewSetting = true;
    }

    // Lưu lịch sử thay đổi cấu hình
    if (setting) {
      const historyRecord = new SettingHistory({
        settingId: setting._id,
        type: setting.type,
        data: isNewSetting ? setting.data : oldData,
        changeType: isNewSetting ? 'create' : 'update',
        changedBy: body.userId || 'system'
      });

      await historyRecord.save();
    }

    // Không cần giải phóng kết nối MongoDB vì nó được quản lý tự động

    return NextResponse.json(setting, { status: 201 });
  } catch (error) {
    console.error('Lỗi khi tạo setting:', error);

    // Không cần giải phóng kết nối MongoDB vì nó được quản lý tự động

    return NextResponse.json(
      { error: 'Lỗi khi tạo setting' },
      { status: 500 }
    );
  }
}
