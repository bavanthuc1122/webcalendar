import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, releaseConnection } from '@/lib/mongodb';
import { SettingHistory } from '@/models';

// GET /api/settings/history - Lấy lịch sử cấu hình
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const settingId = searchParams.get('settingId');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;

    await connectToDatabase();

    // Xây dựng query dựa trên các tham số
    const query: any = {};
    if (type) query.type = type;
    if (settingId) query.settingId = settingId;

    // Đếm tổng số bản ghi để phân trang
    const total = await SettingHistory.countDocuments(query);

    // Lấy lịch sử cấu hình với phân trang
    const history = await SettingHistory.find(query)
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian giảm dần (mới nhất trước)
      .skip(skip)
      .limit(limit);

    // Giải phóng kết nối MongoDB
    releaseConnection();

    // Đảm bảo trả về mảng trống nếu không có dữ liệu
    return NextResponse.json({
      history: history || [],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử cấu hình:', error);

    // Giải phóng kết nối MongoDB
    releaseConnection();

    return NextResponse.json(
      { error: 'Lỗi khi lấy lịch sử cấu hình' },
      { status: 500 }
    );
  }
}
