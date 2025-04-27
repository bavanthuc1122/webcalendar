import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG GOOGLE AUTH CALLBACK ===');
    console.log('1. Bắt đầu xử lý callback từ Google OAuth2');

    // Lấy code từ query params
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    console.log('2. Đã nhận code từ Google:', !!code);

    if (!code) {
      console.error('Không nhận được mã xác thực từ Google');
      return NextResponse.redirect(new URL('/error?message=Không nhận được mã xác thực từ Google', request.url));
    }

    // Giải mã state để lấy client_id và client_secret
    let clientId, clientSecret;
    try {
      if (state) {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        clientId = stateData.client_id;
        clientSecret = stateData.client_secret;
      }
    } catch (error) {
      console.error('Lỗi khi giải mã state:', error);
    }

    // Nếu không có client_id và client_secret trong state, sử dụng từ biến môi trường
    if (!clientId || !clientSecret) {
      clientId = process.env.GOOGLE_CLIENT_ID;
      clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.redirect(new URL('/error?message=Thiếu thông tin xác thực', request.url));
      }
    }

    // Tạo OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      process.env.GOOGLE_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/callback/google`
    );

    console.log('3. Bắt đầu trao đổi code lấy tokens');

    // Trao đổi code lấy tokens
    const { tokens } = await oauth2Client.getToken(code);

    console.log('4. Đã nhận tokens từ Google:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date
    });

    // Kiểm tra xem có refresh_token không
    if (!tokens.refresh_token) {
      console.error('Không nhận được refresh token từ Google');
      return NextResponse.redirect(new URL('/error?message=Không nhận được refresh token. Vui lòng thử lại và đảm bảo bạn đã chọn "Cho phép" trong màn hình xác thực.', request.url));
    }

    console.log('5. Bắt đầu lưu tokens vào MongoDB');

    // Lưu tokens vào MongoDB
    await connectToDatabase();

    // Xóa tất cả cấu hình Google Calendar hiện có để tránh nhầm lẫn
    console.log('5.1. Xóa tất cả cấu hình Google Calendar hiện có');
    await Setting.deleteMany({ type: 'googleCalendar' });

    // Tìm cấu hình hiện tại (chỉ để kiểm tra, thực tế đã xóa hết)
    const existingSettings = await Setting.findOne({
      type: 'googleCalendar'
    });

    // Vì đã xóa tất cả cấu hình, nên luôn tạo cấu hình mới
    console.log('6. Tạo cấu hình mới với refresh token');

    // Tạo cấu hình mới
    const newSetting = await Setting.create({
      type: 'googleCalendar',
      data: {
        clientId,
        clientSecret,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        tokenExpiry: tokens.expiry_date
      },
      isDefault: true
    });

    console.log('7. Đã tạo cấu hình mới với refresh token:', {
      id: newSetting._id,
      hasRefreshToken: !!newSetting.data.refreshToken
    });

    console.log('8. Xác thực thành công, chuyển hướng về trang thành công');

    // Chuyển hướng về trang thành công
    return NextResponse.redirect(new URL('/success?message=Xác thực Google Calendar thành công!', request.url));
  } catch (error) {
    console.error('Lỗi khi xử lý callback Google OAuth2:', error);
    return NextResponse.redirect(new URL(`/error?message=Lỗi khi xác thực: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`, request.url));
  }
}
