import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, releaseConnection } from '@/lib/mongodb';
import { Setting, SettingHistory } from '@/models';

// POST /api/settings/import - Nhập cấu hình từ file JSON
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string || 'system';
    const overwrite = formData.get('overwrite') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'Không tìm thấy file' },
        { status: 400 }
      );
    }

    // Đọc nội dung file
    const fileContent = await file.text();
    let settings;

    try {
      settings = JSON.parse(fileContent);
    } catch (error) {
      return NextResponse.json(
        { error: 'File không phải là JSON hợp lệ' },
        { status: 400 }
      );
    }

    // Kiểm tra xem settings có phải là mảng không
    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Dữ liệu không đúng định dạng. Cần một mảng các cấu hình.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Kết quả nhập
    const result = {
      total: settings.length,
      imported: 0,
      skipped: 0,
      errors: 0,
      details: [] as string[]
    };

    // Nhập từng cấu hình
    for (const settingData of settings) {
      try {
        // Kiểm tra xem cấu hình có hợp lệ không
        if (!settingData.type || !settingData.data) {
          result.errors++;
          result.details.push(`Bỏ qua cấu hình không hợp lệ: thiếu type hoặc data`);
          continue;
        }

        // Kiểm tra xem cấu hình đã tồn tại chưa
        const existingSetting = await Setting.findOne({
          type: settingData.type,
          isDefault: settingData.isDefault || false
        });

        if (existingSetting && !overwrite) {
          // Bỏ qua nếu đã tồn tại và không cho phép ghi đè
          result.skipped++;
          result.details.push(`Bỏ qua cấu hình đã tồn tại: ${settingData.type}`);
          continue;
        }

        if (existingSetting && overwrite) {
          // Cập nhật nếu đã tồn tại và cho phép ghi đè
          const oldData = existingSetting.data;
          
          // Cập nhật cấu hình
          existingSetting.data = settingData.data;
          existingSetting.isDefault = settingData.isDefault || false;
          existingSetting.updatedAt = new Date();
          await existingSetting.save();

          // Lưu lịch sử
          const historyRecord = new SettingHistory({
            settingId: existingSetting._id,
            type: existingSetting.type,
            data: oldData,
            changeType: 'update',
            changedBy: userId
          });
          await historyRecord.save();

          result.imported++;
          result.details.push(`Đã cập nhật cấu hình: ${settingData.type}`);
        } else {
          // Tạo mới nếu chưa tồn tại
          const newSetting = new Setting({
            type: settingData.type,
            data: settingData.data,
            isDefault: settingData.isDefault || false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await newSetting.save();

          // Lưu lịch sử
          const historyRecord = new SettingHistory({
            settingId: newSetting._id,
            type: newSetting.type,
            data: newSetting.data,
            changeType: 'create',
            changedBy: userId
          });
          await historyRecord.save();

          result.imported++;
          result.details.push(`Đã tạo cấu hình mới: ${settingData.type}`);
        }
      } catch (error) {
        console.error('Lỗi khi nhập cấu hình:', error);
        result.errors++;
        result.details.push(`Lỗi khi nhập cấu hình: ${error.message}`);
      }
    }

    // Giải phóng kết nối MongoDB
    releaseConnection();

    return NextResponse.json({
      success: true,
      message: `Đã nhập ${result.imported}/${result.total} cấu hình thành công, bỏ qua ${result.skipped}, lỗi ${result.errors}`,
      result
    });
  } catch (error) {
    console.error('Lỗi khi nhập cấu hình:', error);

    // Giải phóng kết nối MongoDB
    releaseConnection();

    return NextResponse.json(
      { error: 'Lỗi khi nhập cấu hình' },
      { status: 500 }
    );
  }
}
