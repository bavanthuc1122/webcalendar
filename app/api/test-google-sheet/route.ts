import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, sheetId, sheetName } = body;

    // Kiểm tra các trường bắt buộc
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Thiếu API Key. Vui lòng nhập API Key.' },
        { status: 400 }
      );
    }

    if (!sheetId) {
      return NextResponse.json(
        { error: 'Thiếu Sheet ID. Vui lòng nhập ID của Google Sheet.' },
        { status: 400 }
      );
    }

    if (!sheetName) {
      return NextResponse.json(
        { error: 'Thiếu Sheet Name. Vui lòng nhập tên của sheet.' },
        { status: 400 }
      );
    }

    try {
      // Tạo sheets client
      const sheets = google.sheets({
        version: 'v4',
        auth: apiKey,
      });

      // Thử lấy thông tin về sheet
      const response = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
      });

    // Kiểm tra xem sheet có tồn tại không
    const sheetExists = response.data.sheets.some(
      (sheet) => sheet.properties.title === sheetName
    );

    if (!sheetExists) {
      return NextResponse.json(
        { error: `Sheet "${sheetName}" không tồn tại trong Google Sheet.` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kết nối Google Sheet thành công!',
      data: {
        title: response.data.properties.title,
        sheets: response.data.sheets.map((sheet) => sheet.properties.title),
      },
    });
  } catch (error: any) {
    console.error('Lỗi khi kiểm tra kết nối Google Sheet:', error);

    // Kiểm tra lỗi cụ thể
    if (error.code === 403) {
      return NextResponse.json(
        {
          error: 'Không có quyền truy cập. Vui lòng kiểm tra API Key và quyền của ứng dụng.',
          details: error.message
        },
        { status: 403 }
      );
    } else if (error.code === 401) {
      return NextResponse.json(
        {
          error: 'Xác thực không hợp lệ. Vui lòng kiểm tra lại API Key.',
          details: error.message
        },
        { status: 401 }
      );
    } else if (error.code === 404) {
      return NextResponse.json(
        {
          error: 'Không tìm thấy Google Sheet. Vui lòng kiểm tra lại Sheet ID.',
          details: error.message
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Không thể kết nối đến Google Sheet. Vui lòng kiểm tra lại thông tin cấu hình.',
        details: error.message
      },
      { status: 500 }
    );
  }
}
