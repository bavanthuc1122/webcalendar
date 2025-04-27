import { NextRequest, NextResponse } from 'next/server';

// POST /api/export/google-sheet - Xuất dữ liệu lên Google Sheet
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { config, data } = body;

    if (!config || !data) {
      return NextResponse.json(
        { error: 'Thiếu thông tin config hoặc data' },
        { status: 400 }
      );
    }

    // Mô phỏng xuất dữ liệu lên Google Sheet
    console.log('Xuất dữ liệu lên Google Sheet:', { config, dataCount: data.length });

    // Giả lập thời gian xử lý
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({ 
      success: true, 
      message: 'Đã xuất dữ liệu lên Google Sheet thành công',
      timestamp: new Date().toISOString(),
      rowCount: data.length
    });
  } catch (error) {
    console.error('Lỗi khi xuất dữ liệu lên Google Sheet:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xuất dữ liệu lên Google Sheet' },
      { status: 500 }
    );
  }
}
