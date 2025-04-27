import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, clientId, clientSecret } = body;

    // Kiểm tra các trường bắt buộc
    if (!apiKey && (!clientId || !clientSecret)) {
      return NextResponse.json(
        { error: 'Thiếu thông tin cấu hình. Vui lòng nhập API Key hoặc OAuth2 Client ID và Client Secret.' },
        { status: 400 }
      );
    }

    try {
      // Kiểm tra xem có OAuth2 Client ID và Client Secret không
      if (clientId && clientSecret) {
        // Tạo OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
        );

        // Tạo URL xác thực
        const authUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: ['https://www.googleapis.com/auth/calendar'],
          prompt: 'consent', // Luôn yêu cầu refresh token
        });

        // Tạo calendar client với OAuth2
        const calendar = google.calendar({
          version: 'v3',
          auth: oauth2Client,
        });

        // Trả về URL xác thực để client có thể chuyển hướng người dùng
        return NextResponse.json({
          success: true,
          message: 'Cấu hình OAuth2 hợp lệ. Vui lòng xác thực để hoàn tất cài đặt.',
          data: {
            api_name: 'Google Calendar',
            api_version: 'v3',
            auth_url: authUrl,
            client_id: clientId,
            client_secret: clientSecret,
          },
          auth_type: 'oauth2',
        });
      } else if (apiKey) {
        // Tạo calendar client với API Key
        const calendar = google.calendar({
          version: 'v3',
          key: apiKey,
        });

        // Thử kiểm tra kết nối bằng cách gọi một API đơn giản
        // Sử dụng HTTP request trực tiếp thay vì qua client library
        // Kiểm tra kết nối bằng cách gọi API metadata, không yêu cầu OAuth2
        const response = await fetch(`https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest?key=${apiKey}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Kiểm tra response
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Không thể kết nối đến Google Calendar API');
        }

        const data = await response.json();

        // Nếu không có lỗi, kết nối thành công
        return NextResponse.json({
          success: true,
          message: 'Kết nối Google Calendar thành công với API Key! Lưu ý: API Key không thể thêm sự kiện vào lịch.',
          data: {
            // Trả về thông tin cơ bản về API
            api_name: data.name,
            api_version: data.version,
            api_description: data.description?.substring(0, 100) + '...',
          },
          auth_type: 'api_key',
        });
      }
    } catch (error: any) {
      console.error('Lỗi khi kiểm tra kết nối Google Calendar:', error);

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
      } else if (error.message && error.message.includes('ctr is not a constructor')) {
        return NextResponse.json(
          {
            error: 'Lỗi khởi tạo Google Calendar API. API Key không hợp lệ hoặc không có quyền truy cập vào Google Calendar API.',
            details: 'Vui lòng đảm bảo API Key hợp lệ và đã kích hoạt Google Calendar API trong Google Cloud Console.'
          },
          { status: 400 }
        );
      } else if (error.message && error.message.includes('Login Required')) {
        return NextResponse.json(
          {
            error: 'Xác thực không hợp lệ. API Key không đủ quyền để thực hiện thao tác này.',
            details: 'API Key chỉ có thể truy cập các API công khai. Một số tính năng có thể yêu cầu xác thực OAuth2.'
          },
          { status: 401 }
        );
      } else if (error.message && error.message.includes("Method doesn't allow unregistered callers")) {
        return NextResponse.json(
          {
            error: 'API Key không được cấu hình đúng.',
            details: 'Vui lòng đảm bảo API Key đã được tạo đúng cách và đã kích hoạt Google Calendar API trong Google Cloud Console. Đồng thời, kiểm tra xem API Key có bị giới hạn bởi HTTP referrers hoặc IP addresses không.'
          },
          { status: 403 }
        );
      } else if (error.message && error.message.includes("API keys are not supported by this API")) {
        return NextResponse.json(
          {
            error: 'API này không hỗ trợ API Key.',
            details: 'Google Calendar API yêu cầu xác thực OAuth2 cho một số endpoint. Tuy nhiên, bạn vẫn có thể sử dụng API Key cho các tính năng cơ bản như thêm sự kiện vào lịch.'
          },
          { status: 400 }
        );
      }

      // Trích xuất thông báo lỗi chi tiết
      let errorDetails = error.message;
      if (error.errors && error.errors.length > 0) {
        errorDetails = error.errors.map((e: any) => e.message || e.reason).join(', ');
      }

      return NextResponse.json(
        {
          error: 'Không thể kết nối đến Google Calendar. Vui lòng kiểm tra lại thông tin cấu hình.',
          details: errorDetails
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
