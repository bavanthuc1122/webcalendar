import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, releaseConnection } from '@/lib/mongodb';
import { Setting } from '@/models';

// GET /api/settings/export - Xuất cấu hình theo loại
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const all = searchParams.get('all') === 'true';

    await connectToDatabase();

    // Xây dựng query dựa trên các tham số
    const query: any = {};
    if (type && !all) query.type = type;

    // Lấy cấu hình từ database
    const settings = await Setting.find(query);

    // Giải phóng kết nối MongoDB
    releaseConnection();

    // Tạo tên file để download
    const filename = type ? `settings-${type}-${new Date().toISOString().split('T')[0]}.json` : `all-settings-${new Date().toISOString().split('T')[0]}.json`;

    // Trả về cấu hình dưới dạng file JSON để download
    return new NextResponse(JSON.stringify(settings, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename=${filename}`
      }
    });
  } catch (error) {
    console.error('Lỗi khi xuất cấu hình:', error);

    // Giải phóng kết nối MongoDB
    releaseConnection();

    return NextResponse.json(
      { error: 'Lỗi khi xuất cấu hình' },
      { status: 500 }
    );
  }
}
