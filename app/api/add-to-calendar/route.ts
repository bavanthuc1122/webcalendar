import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Hàm để lấy OAuth2Client đã được xác thực
async function getAuthClient() {
  // Trong môi trường thực tế, bạn sẽ cần thiết lập OAuth2 hoặc sử dụng Service Account
  // Đây là một ví dụ đơn giản sử dụng API key
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return auth.getClient();
}

export async function POST(request: NextRequest) {
  try {
    const { summary, description, start, end } = await request.json();

    // Kiểm tra dữ liệu đầu vào
    if (!summary || !start || !end) {
      return NextResponse.json(
        { error: 'Thiếu thông tin cần thiết' },
        { status: 400 }
      );
    }

    try {
      // Lấy client đã xác thực
      const auth = await getAuthClient();
      
      // Tạo calendar client
      const calendar = google.calendar({ version: 'v3', auth });
      
      // Tạo sự kiện
      const event = {
        summary,
        description,
        start: {
          dateTime: start,
          timeZone: 'Asia/Ho_Chi_Minh',
        },
        end: {
          dateTime: end,
          timeZone: 'Asia/Ho_Chi_Minh',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };
      
      // Thêm sự kiện vào calendar
      const result = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });
      
      return NextResponse.json({ 
        success: true, 
        eventId: result.data.id,
        eventLink: result.data.htmlLink
      });
    } catch (error) {
      console.error('Lỗi khi thêm sự kiện vào Google Calendar:', error);
      return NextResponse.json(
        { error: 'Không thể thêm sự kiện vào Google Calendar' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Lỗi khi xử lý yêu cầu:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xử lý yêu cầu' },
      { status: 500 }
    );
  }
}
