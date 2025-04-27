import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models';

// Hàm kiểm tra định dạng thời gian RFC3339
function isValidRFC3339(dateString: string): boolean {
  try {
    // Kiểm tra định dạng RFC3339
    // Format: YYYY-MM-DDTHH:MM:SS+HH:MM hoặc YYYY-MM-DDTHH:MM:SSZ
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?(([+-]\d{2}:\d{2})|Z)$/.test(dateString)) {
      console.log('Định dạng thời gian RFC3339 không hợp lệ:', dateString);
      return false;
    }

    // Kiểm tra tính hợp lệ của ngày tháng
    const date = new Date(dateString);
    const isValid = !isNaN(date.getTime());

    if (!isValid) {
      console.log('Ngày tháng không hợp lệ:', dateString);
    }

    return isValid;
  } catch (error) {
    console.error('Lỗi khi kiểm tra định dạng thời gian:', error);
    return false;
  }
}

// Hàm kiểm tra xem chuỗi có kết thúc bằng 'Z' không (UTC)
function isUTCString(dateString: string): boolean {
  return dateString.endsWith('Z');
}

// Hàm để lấy OAuth2Client đã được xác thực
async function getAuthClient() {
  try {
    // Kết nối đến MongoDB
    await connectToDatabase();

    // Lấy cấu hình Google Calendar từ MongoDB
    const googleCalendarSettings = await Setting.find({ type: 'googleCalendar' });

    console.log('Số lượng cấu hình Google Calendar tìm thấy:', googleCalendarSettings?.length || 0);

    // Không cần giải phóng kết nối MongoDB vì nó được quản lý tự động

    // Kiểm tra xem có cấu hình không
    if (!googleCalendarSettings || googleCalendarSettings.length === 0) {
      console.log('Không tìm thấy cấu hình Google Calendar trong MongoDB, sử dụng biến môi trường');

      // Sử dụng cấu hình từ biến môi trường nếu không có trong MongoDB
      if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        // Tạo OAuth2 client từ biến môi trường
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
        );

        // Nếu có refresh token, sử dụng nó để lấy access token mới
        if (process.env.GOOGLE_REFRESH_TOKEN) {
          oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
          });
          console.log('Đã tạo OAuth2 client từ biến môi trường với refresh token');
          return oauth2Client;
        } else {
          console.error('Không tìm thấy refresh token trong biến môi trường');
          throw new Error('Không tìm thấy refresh token cho OAuth2');
        }
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Sử dụng service account nếu có
        console.log('Sử dụng service account từ biến môi trường');
        const auth = new google.auth.GoogleAuth({
          keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
          scopes: ['https://www.googleapis.com/auth/calendar'],
        });
        return auth.getClient();
      } else {
        console.error('Không tìm thấy cấu hình Google Calendar trong MongoDB hoặc biến môi trường');
        throw new Error('Không tìm thấy cấu hình Google Calendar');
      }
    }

    // Tìm cấu hình mặc định hoặc lấy cấu hình đầu tiên
    const defaultConfig = googleCalendarSettings.find(config => config.isDefault) || googleCalendarSettings[0];

    if (!defaultConfig || !defaultConfig.data) {
      console.error('Không tìm thấy cấu hình Google Calendar hợp lệ');
      throw new Error('Không tìm thấy cấu hình Google Calendar hợp lệ');
    }

    // Log để debug
    console.log('Cấu hình Google Calendar tìm thấy:', {
      hasClientId: !!defaultConfig.data.clientId,
      hasClientSecret: !!defaultConfig.data.clientSecret,
      hasRefreshToken: !!defaultConfig.data.refreshToken,
      hasApiKey: !!defaultConfig.data.apiKey,
      redirectUri: defaultConfig.data.redirectUri || 'http://localhost:3000/api/auth/callback/google'
    });

    // Ưu tiên sử dụng OAuth2 nếu có
    if (defaultConfig.data.clientId && defaultConfig.data.clientSecret) {
      // Tạo OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        defaultConfig.data.clientId,
        defaultConfig.data.clientSecret,
        defaultConfig.data.redirectUri || 'http://localhost:3000/api/auth/callback/google'
      );

      // Nếu có refresh token, sử dụng nó để lấy access token mới
      if (defaultConfig.data.refreshToken) {
        oauth2Client.setCredentials({
          refresh_token: defaultConfig.data.refreshToken
        });
        console.log('Đã tạo OAuth2 client với refresh token từ MongoDB');
        return oauth2Client;
      } else {
        console.error('Không tìm thấy refresh token trong cấu hình MongoDB');
        throw new Error('Không tìm thấy refresh token cho OAuth2. Vui lòng xác thực lại với Google Calendar.');
      }
    } else if (defaultConfig.data.apiKey) {
      // Fallback to API Key nếu không có OAuth2
      console.warn('Sử dụng API Key thay vì OAuth2. Một số tính năng có thể không hoạt động.');
      return defaultConfig.data.apiKey;
    } else {
      console.error('Không tìm thấy thông tin xác thực Google Calendar trong cấu hình MongoDB');
      throw new Error('Không tìm thấy thông tin xác thực Google Calendar');
    }
  } catch (error) {
    console.error('Lỗi khi lấy cấu hình Google Calendar:', error);

    // Fallback to environment variables
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
      // Tạo OAuth2 client từ biến môi trường
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });
      return oauth2Client;
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Sử dụng service account nếu có
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });
      return auth.getClient();
    } else {
      throw new Error('Không tìm thấy cấu hình Google Calendar');
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('Dữ liệu nhận được:', data);

    // Log để debug
    console.log('=== DEBUG ADD TO CALENDAR ===');
    console.log('1. Bắt đầu xử lý yêu cầu thêm sự kiện vào lịch');

    const { summary, description } = data;

    // Kiểm tra dữ liệu đầu vào
    if (!summary || !data.start || !data.end) {
      return NextResponse.json(
        { error: 'Thiếu thông tin cần thiết' },
        { status: 400 }
      );
    }

    // Kiểm tra định dạng thời gian
    if (data.start.dateTime && data.end.dateTime) {
      // Kiểm tra định dạng RFC3339
      if (!isValidRFC3339(data.start.dateTime) || !isValidRFC3339(data.end.dateTime)) {
        return NextResponse.json(
          {
            error: 'Định dạng thời gian không hợp lệ',
            details: 'Thời gian phải theo định dạng RFC3339 (ví dụ: 2023-08-16T10:00:00Z)',
            receivedStart: data.start.dateTime,
            receivedEnd: data.end.dateTime
          },
          { status: 400 }
        );
      }

      // Kiểm tra xem chuỗi có phải là UTC (kết thúc bằng 'Z') không
      const isStartUTC = isUTCString(data.start.dateTime);
      const isEndUTC = isUTCString(data.end.dateTime);

      // Nếu không phải UTC, trả về lỗi
      if (!isStartUTC || !isEndUTC) {
        return NextResponse.json(
          {
            error: 'Định dạng thời gian không hợp lệ',
            details: 'Thời gian phải ở định dạng UTC (kết thúc bằng Z)',
            receivedStart: data.start.dateTime,
            receivedEnd: data.end.dateTime
          },
          { status: 400 }
        );
      }

      // Kiểm tra thời gian bắt đầu và kết thúc
      const startDate = new Date(data.start.dateTime);
      const endDate = new Date(data.end.dateTime);

      if (startDate >= endDate) {
        return NextResponse.json(
          {
            error: 'Thời gian không hợp lệ',
            details: 'Thời gian kết thúc phải sau thời gian bắt đầu',
            startTime: data.start.dateTime,
            endTime: data.end.dateTime
          },
          { status: 400 }
        );
      }
    } else if (!data.start.dateTime || !data.end.dateTime) {
      return NextResponse.json(
        {
          error: 'Định dạng thời gian không hợp lệ',
          details: 'Thời gian phải có thuộc tính dateTime với định dạng RFC3339',
          receivedData: data
        },
        { status: 400 }
      );
    }

    try {
      // Log để debug
      console.log('2. Bắt đầu lấy client đã xác thực');

      // Lấy client đã xác thực hoặc API key
      const authOrApiKey = await getAuthClient();

      console.log('3. Đã lấy client xác thực:', {
        type: typeof authOrApiKey,
        isNull: authOrApiKey === null,
        isString: typeof authOrApiKey === 'string'
      });

      // Tạo calendar client
      let calendar;

      if (typeof authOrApiKey === 'string') {
        // Sử dụng API Key - Lưu ý: API Key không thể thêm sự kiện vào lịch
        console.warn('Đang sử dụng API Key thay vì OAuth2. Không thể thêm sự kiện vào lịch với API Key.');
        throw new Error('API Key không đủ quyền để thêm sự kiện vào lịch. Vui lòng cấu hình OAuth2.');
      } else {
        // Sử dụng OAuth client
        calendar = google.calendar({
          version: 'v3',
          auth: authOrApiKey
        });

        // Kiểm tra xem OAuth client có hoạt động không
        try {
          // Thử lấy danh sách lịch để kiểm tra kết nối
          const response = await calendar.calendarList.list({
            maxResults: 1,
          });

          console.log('OAuth client hoạt động tốt, tìm thấy', response.data.items?.length || 0, 'lịch');
        } catch (error) {
          console.error('Lỗi khi kiểm tra OAuth client:', error);
          // Nếu có lỗi xác thực, ném lỗi để xử lý ở phía trên
          if (error.message && (error.message.includes('invalid_grant') || error.message.includes('unauthorized_client'))) {
            throw new Error('Lỗi xác thực OAuth2. Vui lòng cấu hình lại hoặc làm mới token.');
          }
        }
      }

      // Log thông tin thời gian để debug
      console.log('Thông tin thời gian:', {
        start: data.start,
        end: data.end
      });

      // Tạo sự kiện với định dạng thời gian RFC3339
      // Sử dụng cấu trúc theo tài liệu của Google Calendar API
      // https://developers.google.com/calendar/api/v3/reference/events/insert

      const event = {
        summary: summary || 'Sự kiện mới',
        description: description || '',
        // Sử dụng dữ liệu start và end từ client với định dạng RFC3339
        start: data.start,
        end: data.end,
        // Thêm các trường bổ sung
        colorId: '1', // Màu mặc định (xanh dương)
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // Nhắc nhở qua email trước 1 ngày
            { method: 'popup', minutes: 30 }, // Nhắc nhở qua popup trước 30 phút
          ],
        },
        // Đặt trạng thái hiển thị là bận
        transparency: 'opaque',
        // Đặt trạng thái tham dự là đã xác nhận
        status: 'confirmed',
      };

      try {
        console.log('4. Bắt đầu thêm sự kiện vào calendar');

        // Thêm sự kiện vào calendar
        const result = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event,
        });

        console.log('5. Đã thêm sự kiện thành công:', {
          eventId: result.data.id,
          eventLink: result.data.htmlLink
        });

        return NextResponse.json({
          success: true,
          eventId: result.data.id,
          eventLink: result.data.htmlLink
        });
      } catch (insertError: any) {
        console.error('Lỗi khi thêm sự kiện vào Google Calendar:', insertError);
        console.log('5. Lỗi khi thêm sự kiện:', {
          message: insertError.message,
          stack: insertError.stack
        });

        // Kiểm tra lỗi cụ thể
        if (insertError.message && insertError.message.includes('API keys are not supported')) {
          return NextResponse.json(
            {
              error: 'API Key không đủ quyền để thêm sự kiện vào lịch.',
              details: 'Để thêm sự kiện vào lịch, bạn cần xác thực OAuth2. Vui lòng liên hệ quản trị viên để được hỗ trợ.',
              technicalDetails: insertError.message
            },
            { status: 403 }
          );
        } else if (insertError.message && insertError.message.includes('Login Required')) {
          return NextResponse.json(
            {
              error: 'Xác thực không hợp lệ. Vui lòng đăng nhập lại.',
              details: 'Phiên đăng nhập của bạn đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại để tiếp tục.',
              technicalDetails: insertError.message
            },
            { status: 401 }
          );
        } else if (insertError.message && insertError.message.includes('Invalid time value')) {
          return NextResponse.json(
            {
              error: 'Định dạng thời gian không hợp lệ.',
              details: 'Thời gian phải theo định dạng RFC3339 UTC (ví dụ: 2023-08-16T10:00:00Z).',
              technicalDetails: insertError.message,
              receivedData: { start: data.start, end: data.end }
            },
            { status: 400 }
          );
        }

        // Lỗi khác
        return NextResponse.json(
          {
            error: 'Không thể thêm sự kiện vào Google Calendar',
            details: insertError.message
          },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error('Lỗi khi thêm sự kiện vào Google Calendar:', error);
      return NextResponse.json(
        {
          error: 'Không thể thêm sự kiện vào Google Calendar',
          details: error.message || 'Lỗi không xác định'
        },
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
